package com.platform.gateway.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final byte[] secretKeyBytes;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtService(
            @Value("${platform.security.jwt.secret:veyrion_dev_jwt_secret_signing_key_32_characters_minimum}") String secret) {
        if (secret == null || secret.length() < 32) {
            log.warn("[GATEWAY_JWT_WARN] Configured JWT secret is shorter than 32 characters; applying padding.");
            secret = (secret == null ? "" : secret) + "veyrion_default_secret_padding_32_chars";
        }
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public boolean isJwtToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String trimmed = token.trim();
        return trimmed.startsWith("eyJ") && trimmed.contains(".");
    }

    public String generateToken(String username, List<String> roles) {
        return generateToken(username, roles, Collections.emptyMap(), 86400000L);
    }

    public String generateToken(String username, List<String> roles, Map<String, Object> additionalClaims, long validityMs) {
        try {
            long nowSeconds = System.currentTimeMillis() / 1000L;
            long expSeconds = nowSeconds + (validityMs / 1000L);

            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "JWT"
            );
            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    objectMapper.writeValueAsBytes(header)
            );

            Map<String, Object> payload = new java.util.HashMap<>();
            if (additionalClaims != null) {
                payload.putAll(additionalClaims);
            }
            payload.put("sub", username);
            payload.put("roles", roles != null ? roles : List.of("ROLE_USER"));
            payload.put("iss", "veyrion-platform");
            payload.put("iat", nowSeconds);
            payload.put("exp", expSeconds);

            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    objectMapper.writeValueAsBytes(payload)
            );

            String signingInput = encodedHeader + "." + encodedPayload;
            byte[] signatureBytes = computeHmac(signingInput.getBytes(StandardCharsets.UTF_8));
            String encodedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);

            return signingInput + "." + encodedSignature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate JWT token", e);
        }
    }

    public JwtValidationResult validateToken(String token) {
        if (token == null || token.isBlank()) {
            return JwtValidationResult.failure("MISSING_TOKEN", "JWT token is required.");
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            return JwtValidationResult.failure("MALFORMED_JWT", "JWT must contain header, payload, and signature components.");
        }

        try {
            // Validate header
            byte[] headerBytes = Base64.getUrlDecoder().decode(parts[0]);
            Map<String, Object> header = objectMapper.readValue(headerBytes, new TypeReference<>() {});
            String alg = (String) header.get("alg");

            if (alg == null || "none".equalsIgnoreCase(alg) || !"HS256".equals(alg)) {
                return JwtValidationResult.failure("UNSUPPORTED_ALGORITHM", "JWT algorithm '" + alg + "' is not permitted. Only HS256 is accepted.");
            }

            // Verify signature using constant-time comparison
            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSignature = computeHmac(signingInput.getBytes(StandardCharsets.UTF_8));
            byte[] providedSignature = Base64.getUrlDecoder().decode(parts[2]);

            if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
                return JwtValidationResult.failure("TAMPERED_JWT", "JWT signature validation failed; token has been tampered with or signed with an untrusted key.");
            }

            // Parse payload
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> payload = objectMapper.readValue(payloadBytes, new TypeReference<>() {});

            // Validate expiration
            Object expObj = payload.get("exp");
            if (expObj instanceof Number expNumber) {
                long expSeconds = expNumber.longValue();
                long nowSeconds = System.currentTimeMillis() / 1000L;
                if (nowSeconds >= expSeconds) {
                    return JwtValidationResult.failure("EXPIRED_JWT", "JWT token has expired.");
                }
            } else {
                return JwtValidationResult.failure("INVALID_CLAIMS", "JWT token is missing an expiration timestamp (exp).");
            }

            String username = (String) payload.get("sub");
            if (username == null || username.isBlank()) {
                return JwtValidationResult.failure("INVALID_CLAIMS", "JWT token is missing the subject identifier (sub).");
            }

            List<String> roles = Collections.emptyList();
            Object rolesObj = payload.get("roles");
            if (rolesObj instanceof List<?> list) {
                roles = list.stream().map(Object::toString).toList();
            }

            return JwtValidationResult.success(username, roles, payload);
        } catch (IllegalArgumentException e) {
            return JwtValidationResult.failure("MALFORMED_JWT", "JWT token contains invalid Base64Url encoding.");
        } catch (Exception e) {
            return JwtValidationResult.failure("INVALID_JWT", "Failed to validate JWT token: " + e.getMessage());
        }
    }

    private byte[] computeHmac(byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyBytes, HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            return mac.doFinal(data);
        } catch (NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256", e);
        }
    }

    public record JwtValidationResult(
            boolean valid,
            String username,
            List<String> roles,
            Map<String, Object> claims,
            String errorCode,
            String errorMessage
    ) {
        public static JwtValidationResult success(String username, List<String> roles, Map<String, Object> claims) {
            return new JwtValidationResult(true, username, roles, claims, null, null);
        }

        public static JwtValidationResult failure(String errorCode, String errorMessage) {
            return new JwtValidationResult(false, null, List.of(), Map.of(), errorCode, errorMessage);
        }
    }
}
