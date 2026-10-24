package com.platform.gateway.dto;

import java.util.List;
import java.util.Set;

public record GatewayApiConfig(
    String apiId,
    String upstreamBaseUrl,
    String status,
    Set<String> allowedMethods,
    String allowedPathPrefix,
    Integer connectTimeoutMs,
    Integer rateLimitRps,
    Long maxRequestBodyBytes,
    List<String> activeKeyHashes
) {}
