package com.platform.controlplane.dto;

import java.time.Instant;
import com.platform.controlplane.model.KeyStatus;

public record ApiKeyDto(
    String id,
    String apiId,
    String keyName,
    String keyPrefix,
    KeyStatus status,
    Instant createdAt,
    Instant revokedAt
) {}
