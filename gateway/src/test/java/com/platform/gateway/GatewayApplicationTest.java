package com.platform.gateway;

import java.io.IOException;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayApplicationTest {

    private static MockWebServer mockBackend;

    @Autowired
    private WebTestClient webTestClient;

    @BeforeAll
    static void startMockBackend() throws IOException {
        mockBackend = new MockWebServer();
        mockBackend.start();
    }

    @AfterAll
    static void shutdownMockBackend() throws IOException {
        if (mockBackend != null) {
            mockBackend.shutdown();
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("BACKEND_URL", () -> mockBackend.url("/").toString());
    }

    @Test
    void healthEndpointReturnsUp() {
        webTestClient.get()
            .uri("/api/gateway/health")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.service").isEqualTo("api-gateway")
            .jsonPath("$.status").isEqualTo("UP")
            .jsonPath("$.timestamp").isNotEmpty();
    }

    @Test
    void actuatorHealthReturnsUp() {
        webTestClient.get()
            .uri("/actuator/health")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.status").isEqualTo("UP");
    }

    @Test
    void routesToBackendAndReturnsResponse() throws InterruptedException {
        String backendResponseBody = """
            {"resource":"demo","message":"The protected sample API is responding.","status":"SUCCESS"}
            """;

        mockBackend.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody(backendResponseBody));

        webTestClient.get()
            .uri("/api/demo/resource")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.resource").isEqualTo("demo")
            .jsonPath("$.status").isEqualTo("SUCCESS")
            .jsonPath("$.message").isEqualTo("The protected sample API is responding.");

        RecordedRequest recordedRequest = mockBackend.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("GET");
        assertThat(recordedRequest.getPath()).isEqualTo("/api/demo/resource");
    }
}
