package com.platform.controlplane.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

import com.platform.controlplane.dto.ApiKeyDto;
import com.platform.controlplane.dto.CreateApiKeyResponse;
import com.platform.controlplane.model.ApiKey;
import com.platform.controlplane.model.KeyStatus;
import com.platform.controlplane.repository.ApiKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Transactional
    public CreateApiKeyResponse createKey(String apiId, String keyName) {
        if (keyName == null || keyName.isBlank()) {
            keyName = "Default Key";
        }

        // Generate 32 bytes (256 bits) cryptographically random secret
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String randomHex = HexFormat.of().formatHex(randomBytes);

        String rawApiKey = "asp_live_" + randomHex;
        String keyPrefix = rawApiKey.substring(0, 17) + "...";
        String keyHash = hashKey(rawApiKey);

        ApiKey apiKey = new ApiKey(apiId, keyName.trim(), keyPrefix, keyHash);
        apiKey = apiKeyRepository.save(apiKey);

        return new CreateApiKeyResponse(
            apiKey.getId(),
            apiKey.getApiId(),
            apiKey.getKeyName(),
            apiKey.getKeyPrefix(),
            rawApiKey,
            apiKey.getStatus(),
            apiKey.getCreatedAt(),
            "Copy this secret API key now. For security reasons, it cannot be viewed again."
        );
    }

    @Transactional(readOnly = true)
    public List<ApiKeyDto> listKeys(String apiId) {
        return apiKeyRepository.findByApiId(apiId).stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public void revokeKey(String apiId, String keyId) {
        ApiKey key = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new IllegalArgumentException("API key not found: " + keyId));
        if (!key.getApiId().equals(apiId)) {
            throw new IllegalArgumentException("Key does not belong to specified API");
        }
        key.setStatus(KeyStatus.REVOKED);
        key.setRevokedAt(Instant.now());
        apiKeyRepository.save(key);
    }

    @Transactional(readOnly = true)
    public List<String> getActiveKeyHashes(String apiId) {
        return apiKeyRepository.findByApiId(apiId).stream()
            .filter(k -> k.getStatus() == KeyStatus.ACTIVE)
            .map(ApiKey::getKeyHash)
            .toList();
    }

    public static String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private ApiKeyDto toDto(ApiKey key) {
        return new ApiKeyDto(
            key.getId(),
            key.getApiId(),
            key.getKeyName(),
            key.getKeyPrefix(),
            key.getStatus(),
            key.getCreatedAt(),
            key.getRevokedAt()
        );
    }
}
