package com.platform.controlplane.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.controlplane.dto.JwtValidationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String ISSUER = "veyrion-platform";

    private final byte[] secretKeyBytes;
    private final long defaultExpirationMs;
    private final ObjectMapper objectMapper;

    public JwtService(
            @Value("${platform.security.jwt.secret:veyrion_dev_jwt_secret_signing_key_32_characters_minimum}") String secret,
            @Value("${platform.security.jwt.expiration-ms:86400000}") long defaultExpirationMs,
            ObjectMapper objectMapper) {
        if (secret == null || secret.length() < 32) {
            log.warn("[JWT_SECURITY_WARN] Configured JWT secret is shorter than 32 characters; padding to 256 bits.");
            secret = (secret == null ? "" : secret) + "veyrion_default_secret_padding_32_chars";
        }
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.defaultExpirationMs = defaultExpirationMs;
        this.objectMapper = objectMapper;
    }

    public String generateToken(String username, List<String> roles) {
        return generateToken(username, roles, Collections.emptyMap(), defaultExpirationMs);
    }

    public String generateToken(String username, List<String> roles, Map<String, Object> additionalClaims, long validityMs) {
        try {
            long nowSeconds = System.currentTimeMillis() / 1000L;
            long expSeconds = nowSeconds + (validityMs / 1000L);

            // 1. Header
            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "JWT"
            );
            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    objectMapper.writeValueAsBytes(header)
            );

            // 2. Payload
            Map<String, Object> payload = new HashMap<>();
            if (additionalClaims != null) {
                payload.putAll(additionalClaims);
            }
            payload.put("sub", username);
            payload.put("roles", roles != null ? roles : List.of("ROLE_USER"));
            payload.put("iss", ISSUER);
            payload.put("iat", nowSeconds);
            payload.put("exp", expSeconds);

            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    objectMapper.writeValueAsBytes(payload)
            );

            // 3. Signature
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
            // Validate and parse header
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

            // Validate Not Before (nbf) if present
            Object nbfObj = payload.get("nbf");
            if (nbfObj instanceof Number nbfNumber) {
                long nbfSeconds = nbfNumber.longValue();
                long nowSeconds = System.currentTimeMillis() / 1000L;
                if (nowSeconds < nbfSeconds) {
                    return JwtValidationResult.failure("TOKEN_NOT_YET_VALID", "JWT token is not active yet (nbf claim).");
                }
            }

            String username = (String) payload.get("sub");
            if (username == null || username.isBlank()) {
                return JwtValidationResult.failure("INVALID_CLAIMS", "JWT token is missing the subject identifier (sub).");
            }

            List<String> roles = List.of();
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
}
