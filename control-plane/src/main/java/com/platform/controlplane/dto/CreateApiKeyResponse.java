package com.platform.controlplane.dto;

import java.time.Instant;
import com.platform.controlplane.model.KeyStatus;

public record CreateApiKeyResponse(
    String id,
    String apiId,
    String keyName,
    String keyPrefix,
    String apiKey,
    KeyStatus status,
    Instant createdAt,
    String warning
) {}
