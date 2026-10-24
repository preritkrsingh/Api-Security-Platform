package com.platform.controlplane;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ControlPlaneApplicationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.platform.controlplane.repository.SecurityEventRepository securityEventRepository;

    @Autowired
    private com.platform.controlplane.service.SecurityEventService securityEventService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        securityEventRepository.deleteAll();
        securityEventService.initBaselineTelemetry();
    }

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/control/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.service").value("control-plane"))
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void actuatorHealthReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void listSecurityEventsReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/security-events"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].threatType").value("ANOMALOUS_VELOCITY"));
    }

    @Test
    void createValidSecurityEventReturnsCreated() throws Exception {
        String validEventJson = """
            {
              "clientIp": "10.0.0.42",
              "uriPath": "/api/demo/resource",
              "httpMethod": "GET",
              "threatType": "ENDPOINT_FUZZING",
              "severity": "HIGH",
              "riskScore": 0.88,
              "details": "Simulated endpoint fuzzing pattern detected"
            }
            """;

        mockMvc.perform(post("/api/v1/security-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validEventJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.clientIp").value("10.0.0.42"))
            .andExpect(jsonPath("$.threatType").value("ENDPOINT_FUZZING"))
            .andExpect(jsonPath("$.severity").value("HIGH"))
            .andExpect(jsonPath("$.riskScore").value(0.88))
            .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void createInvalidSecurityEventReturnsBadRequest() throws Exception {
        String invalidEventJson = """
            {
              "clientIp": "",
              "uriPath": "/api/demo/resource",
              "httpMethod": "GET",
              "threatType": "ENDPOINT_FUZZING",
              "severity": "HIGH",
              "riskScore": 1.50
            }
            """;

        mockMvc.perform(post("/api/v1/security-events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidEventJson))
            .andExpect(status().isBadRequest());
    }
}
