package com.platform.controlplane;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.controlplane.dto.JwtValidationResult;
import com.platform.controlplane.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private static final String SECRET = "veyrion_test_super_secret_signing_key_at_least_32_bytes";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 3600000L, new ObjectMapper());
    }

    @Test
    @DisplayName("Successfully generates and validates valid JWT")
    void generatesAndValidatesValidJwt() {
        String token = jwtService.generateToken("admin-user", List.of("ROLE_ADMIN", "ROLE_USER"), Map.of("tenantId", "tenant-1"), 3600000L);
        assertThat(token).isNotBlank();

        JwtValidationResult result = jwtService.validateToken(token);
        assertThat(result.valid()).isTrue();
        assertThat(result.username()).isEqualTo("admin-user");
        assertThat(result.roles()).containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER");
        assertThat(result.claims().get("tenantId")).isEqualTo("tenant-1");
    }

    @Test
    @DisplayName("Rejects expired JWT")
    void rejectsExpiredJwt() {
        String token = jwtService.generateToken("expired-user", List.of("ROLE_USER"), Map.of(), -10000L);
        JwtValidationResult result = jwtService.validateToken(token);

        assertThat(result.valid()).isFalse();
        assertThat(result.errorCode()).isEqualTo("EXPIRED_JWT");
    }

    @Test
    @DisplayName("Rejects tampered JWT signature")
    void rejectsTamperedJwtSignature() {
        String token = jwtService.generateToken("legit-user", List.of("ROLE_USER"));
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1] + ".tampered_signature_payload_here";

        JwtValidationResult result = jwtService.validateToken(tampered);
        assertThat(result.valid()).isFalse();
        assertThat(result.errorCode()).isEqualTo("TAMPERED_JWT");
    }

    @Test
    @DisplayName("Rejects malformed JWT")
    void rejectsMalformedJwt() {
        JwtValidationResult result = jwtService.validateToken("not.a.valid.jwt.token");
        assertThat(result.valid()).isFalse();
        assertThat(result.errorCode()).isEqualTo("MALFORMED_JWT");

        JwtValidationResult emptyResult = jwtService.validateToken("");
        assertThat(emptyResult.valid()).isFalse();
        assertThat(emptyResult.errorCode()).isEqualTo("MISSING_TOKEN");
    }
}
