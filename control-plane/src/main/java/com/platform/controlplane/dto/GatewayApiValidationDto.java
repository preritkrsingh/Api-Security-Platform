package com.platform.controlplane.dto;

import java.util.List;
import java.util.Set;
import com.platform.controlplane.model.ProtectionStatus;

public record GatewayApiValidationDto(
    String apiId,
    String upstreamBaseUrl,
    ProtectionStatus status,
    Set<String> allowedMethods,
    String allowedPathPrefix,
    Integer connectTimeoutMs,
    Integer rateLimitRps,
    Long maxRequestBodyBytes,
    List<String> activeKeyHashes
) {}
