package com.platform.controlplane.dto;

import java.util.Set;
import com.platform.controlplane.model.Environment;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateApiRegistrationRequest(
    @Size(min = 2, max = 120, message = "API name must be between 2 and 120 characters")
    String name,

    String upstreamBaseUrl,

    Environment environment,

    Set<String> allowedMethods,

    @Pattern(regexp = "^/.*", message = "Allowed path prefix must start with '/'")
    String allowedPathPrefix,

    @Min(value = 200, message = "Connection timeout must be at least 200ms")
    @Max(value = 60000, message = "Connection timeout cannot exceed 60000ms")
    Integer connectTimeoutMs,

    @Min(value = 1, message = "Rate limit must be at least 1 request/second")
    @Max(value = 50000, message = "Rate limit cannot exceed 50000 requests/second")
    Integer rateLimitRps,

    @Min(value = 1024, message = "Max request body size must be at least 1024 bytes")
    @Max(value = 104857600, message = "Max request body size cannot exceed 100MB")
    Long maxRequestBodyBytes
) {}
