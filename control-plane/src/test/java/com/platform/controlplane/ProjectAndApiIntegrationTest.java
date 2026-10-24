package com.platform.controlplane;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectAndApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Complete Project, API, Credential, and Traffic Flow")
    void testEndToEndControlPlaneWorkflow() throws Exception {
        // 1. Create a Project
        String createProjectJson = """
            {
                "name": "Integration Test Project",
                "description": "Integration testing project description",
                "environment": "DEVELOPMENT"
            }
            """;

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createProjectJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Integration Test Project"))
                .andExpect(jsonPath("$.environment").value("DEVELOPMENT"))
                .andReturn();

        JsonNode projectNode = objectMapper.readTree(projectResult.getResponse().getContentAsString());
        String projectId = projectNode.get("id").asText();
        assertNotNull(projectId);

        // 2. Reject Duplicate Project Name
        mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createProjectJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"));

        // 3. Register an API under the Project
        String registerApiJson = """
            {
                "name": "Integration Sample API",
                "upstreamBaseUrl": "http://localhost:8081",
                "environment": "DEVELOPMENT",
                "allowedMethods": ["GET", "POST"],
                "allowedPathPrefix": "/api",
                "connectTimeoutMs": 3000,
                "rateLimitRps": 100,
                "maxRequestBodyBytes": 1048576
            }
            """;

        MvcResult apiResult = mockMvc.perform(post("/api/projects/" + projectId + "/apis")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerApiJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.projectId").value(projectId))
                .andExpect(jsonPath("$.name").value("Integration Sample API"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.gatewayPath").exists())
                .andReturn();

        JsonNode apiNode = objectMapper.readTree(apiResult.getResponse().getContentAsString());
        String apiId = apiNode.get("id").asText();
        assertNotNull(apiId);

        // 4. Generate an API Key
        String keyRequestJson = """
            {
                "keyName": "Primary Test Key"
            }
            """;

        MvcResult keyResult = mockMvc.perform(post("/api/apis/" + apiId + "/keys")
                .contentType(MediaType.APPLICATION_JSON)
                .content(keyRequestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.apiKey").exists())
                .andExpect(jsonPath("$.keyPrefix").exists())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        JsonNode keyNode = objectMapper.readTree(keyResult.getResponse().getContentAsString());
        String rawApiKey = keyNode.get("apiKey").asText();
        String keyId = keyNode.get("id").asText();
        assertTrue(rawApiKey.startsWith("asp_live_"));

        // 5. List API Keys (Verify Plaintext Key and Hash are NOT Leaked)
        MvcResult listKeysResult = mockMvc.perform(get("/api/apis/" + apiId + "/keys"))
                .andExpect(status().isOk())
                .andReturn();

        String listKeysContent = listKeysResult.getResponse().getContentAsString();
        assertFalse(listKeysContent.contains(rawApiKey), "Plaintext key must not appear in key list");
        assertFalse(listKeysContent.contains("keyHash"), "Hash must not appear in key list");

        // 6. Test Internal Gateway Resolution Endpoint
        mockMvc.perform(get("/api/internal/apis/" + apiId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apiId").value(apiId))
                .andExpect(jsonPath("$.upstreamBaseUrl").value("http://localhost:8081"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.activeKeyHashes").isArray());

        // 7. Deactivate and Activate API
        mockMvc.perform(post("/api/apis/" + apiId + "/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        mockMvc.perform(post("/api/apis/" + apiId + "/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 8. Record Traffic Metadata
        String trafficJson = String.format("""
            {
                "apiId": "%s",
                "httpMethod": "GET",
                "path": "/api/demo/resource",
                "clientIp": "127.0.0.1",
                "statusCode": 200,
                "durationMs": 35,
                "requestSize": 0,
                "responseSize": 120,
                "status": "SUCCESS"
            }
            """, apiId);

        mockMvc.perform(post("/api/traffic")
                .contentType(MediaType.APPLICATION_JSON)
                .content(trafficJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.apiId").value(apiId))
                .andExpect(jsonPath("$.statusCode").value(200));

        // 9. Inspect Traffic Summary and Project Isolation
        mockMvc.perform(get("/api/apis/" + apiId + "/traffic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apiId").value(apiId))
                .andExpect(jsonPath("$.totalRequests").value(1))
                .andExpect(jsonPath("$.successCount").value(1))
                .andExpect(jsonPath("$.recentRequests").isArray());

        mockMvc.perform(get("/api/projects/" + projectId + "/traffic"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "1"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].projectId").value(projectId));

        mockMvc.perform(get("/api/projects/" + projectId + "/traffic/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apiId").value(projectId))
                .andExpect(jsonPath("$.totalRequests").value(1));

        mockMvc.perform(get("/api/traffic/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apiId").value("GLOBAL"))
                .andExpect(jsonPath("$.totalRequests").value(1));

        // 10. Revoke API Key
        mockMvc.perform(delete("/api/apis/" + apiId + "/keys/" + keyId))
                .andExpect(status().isNoContent());

        // 11. Delete Project (Cascading Cleanup)
        mockMvc.perform(delete("/api/projects/" + projectId))
                .andExpect(status().isNoContent());

        // Verify project is deleted
        mockMvc.perform(get("/api/projects/" + projectId))
                .andExpect(status().isBadRequest());
    }
}
