package com.platform.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayDownstreamFailureTest {

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        // Pointing to a dead port to simulate downstream unreachable
        registry.add("BACKEND_URL", () -> "http://localhost:59998");
    }

    @Test
    void downstreamUnreachableReturnsServiceUnavailable() {
        webTestClient.get()
            .uri("/api/demo/resource")
            .exchange()
            .expectStatus().isEqualTo(503)
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.error").isEqualTo("DOWNSTREAM_SERVICE_UNAVAILABLE")
            .jsonPath("$.message").isEqualTo("The downstream protected service is temporarily unavailable or unreachable.")
            .jsonPath("$.path").isEqualTo("/api/demo/resource")
            .jsonPath("$.timestamp").isNotEmpty();
    }
}
