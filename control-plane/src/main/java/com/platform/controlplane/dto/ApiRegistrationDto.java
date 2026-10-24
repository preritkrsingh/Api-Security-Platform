package com.platform.controlplane.dto;

import java.time.Instant;
import java.util.Set;
import com.platform.controlplane.model.ConnectivityStatus;
import com.platform.controlplane.model.Environment;
import com.platform.controlplane.model.ProtectionStatus;

public record ApiRegistrationDto(
    String id,
    String projectId,
    String name,
    String upstreamBaseUrl,
    Environment environment,
    Set<String> allowedMethods,
    String allowedPathPrefix,
    Integer connectTimeoutMs,
    Integer rateLimitRps,
    Long maxRequestBodyBytes,
    ProtectionStatus status,
    ConnectivityStatus connectivityStatus,
    Instant lastConnectivityCheck,
    String gatewayPath,
    Instant createdAt,
    Instant updatedAt
) {}
