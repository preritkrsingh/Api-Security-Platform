package com.platform.gateway;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;

import com.platform.gateway.dto.GatewayApiConfig;
import com.platform.gateway.service.ControlPlaneConfigClient;
import com.platform.gateway.service.JwtService;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DynamicGatewayProxyTest {

    private static MockWebServer mockUpstream;

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ControlPlaneConfigClient configClient;

    @Autowired
    private JwtService jwtService;

    private static final String VALID_KEY = "asp_live_test_1234567890abcdef1234567890";
    private static final String API_ID = "api_test_proxy";

    @BeforeAll
    static void startMockUpstream() throws IOException {
        mockUpstream = new MockWebServer();
        mockUpstream.start();
    }

    @AfterAll
    static void shutdownMockUpstream() throws IOException {
        if (mockUpstream != null) {
            mockUpstream.shutdown();
        }
    }

    @BeforeEach
    void setupConfig() {
        String keyHash = hashKey(VALID_KEY);
        GatewayApiConfig config = new GatewayApiConfig(
                API_ID,
                mockUpstream.url("/").toString(),
                "ACTIVE",
                Set.of("GET", "POST"),
                "/orders",
                3000,
                100,
                2048L, // 2KB max
                List.of(keyHash)
        );
        configClient.setCacheOverride(API_ID, config);
    }

    @Test
    @DisplayName("Routes dynamic request to registered upstream and strips credential")
    void routesToRegisteredUpstreamSuccessfully() throws InterruptedException {
        String upstreamResponse = "{\"status\":\"SUCCESS\",\"orderId\":99}";

        mockUpstream.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(upstreamResponse));

        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders?limit=10")
                .header("X-API-Key", VALID_KEY)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo("SUCCESS")
                .jsonPath("$.orderId").isEqualTo(99);

        RecordedRequest recorded = mockUpstream.takeRequest();
        assertThat(recorded.getMethod()).isEqualTo("GET");
        assertThat(recorded.getPath()).isEqualTo("/orders?limit=10");
        assertThat(recorded.getHeader("X-API-Key")).isNull(); // Credential MUST be stripped
    }

    @Test
    @DisplayName("Rejects unknown API ID with 404 Not Found")
    void rejectsUnknownApiId() {
        webTestClient.get()
                .uri("/proxy/api_unknown_id/items")
                .header("X-API-Key", VALID_KEY)
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.error").isEqualTo("API_NOT_FOUND");
    }

    @Test
    @DisplayName("Rejects inactive API with 403 Forbidden")
    void rejectsInactiveApi() {
        GatewayApiConfig inactiveConfig = new GatewayApiConfig(
                "api_inactive",
                mockUpstream.url("/").toString(),
                "INACTIVE",
                Set.of("GET"),
                "/",
                3000,
                100,
                1048576L,
                List.of(hashKey(VALID_KEY))
        );
        configClient.setCacheOverride("api_inactive", inactiveConfig);

        webTestClient.get()
                .uri("/proxy/api_inactive/resource")
                .header("X-API-Key", VALID_KEY)
                .exchange()
                .expectStatus().isForbidden()
                .expectBody()
                .jsonPath("$.error").isEqualTo("API_INACTIVE");
    }

    @Test
    @DisplayName("Rejects missing API Key with 401 Unauthorized")
    void rejectsMissingApiKey() {
        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("MISSING_API_KEY");
    }

    @Test
    @DisplayName("Rejects invalid API Key with 401 Unauthorized")
    void rejectsInvalidApiKey() {
        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .header("X-API-Key", "asp_live_wrong_invalid_key_999")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("INVALID_API_KEY");
    }

    @Test
    @DisplayName("Rejects disallowed HTTP method with 405 Method Not Allowed")
    void rejectsDisallowedMethod() {
        webTestClient.delete()
                .uri("/proxy/" + API_ID + "/orders")
                .header("X-API-Key", VALID_KEY)
                .exchange()
                .expectStatus().isEqualTo(405)
                .expectBody()
                .jsonPath("$.error").isEqualTo("METHOD_NOT_ALLOWED");
    }

    @Test
    @DisplayName("Rejects disallowed path prefix with 403 Forbidden")
    void rejectsDisallowedPathPrefix() {
        webTestClient.get()
                .uri("/proxy/" + API_ID + "/admin/dashboard")
                .header("X-API-Key", VALID_KEY)
                .exchange()
                .expectStatus().isForbidden()
                .expectBody()
                .jsonPath("$.error").isEqualTo("PATH_PREFIX_FORBIDDEN");
    }

    @Test
    @DisplayName("Allows CORS preflight OPTIONS request with 200 OK and CORS headers")
    void allowsCorsPreflightOptionsRequest() {
        webTestClient.options()
                .uri("/proxy/" + API_ID + "/orders")
                .header("Origin", "http://localhost:8085")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "x-api-key")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:8085")
                .expectHeader().exists("Access-Control-Allow-Methods");
    }

    @Test
    @DisplayName("Routes request with valid Bearer JWT token successfully and sets rate limit headers")
    void routesWithValidJwtTokenSuccessfully() throws InterruptedException {
        String token = jwtService.generateToken("test-user", List.of("ROLE_DEVELOPER"));
        mockUpstream.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"jwtAuth\":true}"));

        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().exists("X-Request-ID")
                .expectHeader().valueEquals("X-RateLimit-Limit", "100")
                .expectHeader().exists("X-RateLimit-Remaining")
                .expectBody()
                .jsonPath("$.jwtAuth").isEqualTo(true);

        RecordedRequest recorded = mockUpstream.takeRequest();
        assertThat(recorded.getHeader("X-Request-ID")).isNotNull();
    }

    @Test
    @DisplayName("Rejects expired JWT token with 401 Unauthorized")
    void rejectsExpiredJwtToken() {
        String expiredToken = jwtService.generateToken("test-user", List.of("ROLE_USER"), java.util.Map.of(), -5000L);

        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .header("Authorization", "Bearer " + expiredToken)
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("EXPIRED_JWT");
    }

    @Test
    @DisplayName("Rejects tampered JWT token with 401 Unauthorized")
    void rejectsTamperedJwtToken() {
        String validToken = jwtService.generateToken("test-user", List.of("ROLE_USER"));
        String[] parts = validToken.split("\\.");
        // Modify the signature
        String tamperedToken = parts[0] + "." + parts[1] + ".tamperedSignature123456789";

        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .header("Authorization", "Bearer " + tamperedToken)
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("TAMPERED_JWT");
    }

    @Test
    @DisplayName("Rejects oversized request body exceeding limit with 413 Payload Too Large")
    void rejectsOversizedRequestBody() {
        // config has 2048 bytes max
        String largeBody = "X".repeat(3000);

        webTestClient.post()
                .uri("/proxy/" + API_ID + "/orders")
                .header("X-API-Key", VALID_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(largeBody)
                .exchange()
                .expectStatus().isEqualTo(413)
                .expectBody()
                .jsonPath("$.error").isEqualTo("PAYLOAD_TOO_LARGE");
    }

    @Test
    @DisplayName("Propagates client X-Request-ID and returns it in response")
    void propagatesCustomRequestId() throws InterruptedException {
        String customReqId = "req_custom_tracer_999";
        mockUpstream.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"ok\":true}"));

        webTestClient.get()
                .uri("/proxy/" + API_ID + "/orders")
                .header("X-API-Key", VALID_KEY)
                .header("X-Request-ID", customReqId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Request-ID", customReqId);

        RecordedRequest recorded = mockUpstream.takeRequest();
        assertThat(recorded.getHeader("X-Request-ID")).isEqualTo(customReqId);
    }

    @Test
    @DisplayName("Enforces rate limiting burst capacity and returns 429 Too Many Requests")
    void enforcesRateLimitingBurst() {
        GatewayApiConfig lowLimitConfig = new GatewayApiConfig(
                "api_rate_test",
                mockUpstream.url("/").toString(),
                "ACTIVE",
                Set.of("GET"),
                "/",
                3000,
                1, // 1 RPS
                1048576L,
                List.of(hashKey(VALID_KEY))
        );
        configClient.setCacheOverride("api_rate_test", lowLimitConfig);

        // Exhaust tokens rapidly
        boolean got429 = false;
        for (int i = 0; i < 15; i++) {
            mockUpstream.enqueue(new MockResponse().setResponseCode(200).setBody("{\"ok\":true}"));
            var exchangeResult = webTestClient.get()
                    .uri("/proxy/api_rate_test/resource")
                    .header("X-API-Key", VALID_KEY)
                    .exchange()
                    .returnResult(String.class);

            if (exchangeResult.getStatus().value() == 429) {
                got429 = true;
                assertThat(exchangeResult.getResponseHeaders().getFirst("Retry-After")).isEqualTo("1");
                assertThat(exchangeResult.getResponseHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("1");
                break;
            }
        }
        assertThat(got429).isTrue();
    }

    private static String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
