package com.platform.controlplane.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecordTrafficRequest(
    @NotBlank String apiId,
    String projectId,
    String requestId,
    @NotBlank String httpMethod,
    @NotBlank String path,
    String clientIp,
    @NotNull Integer statusCode,
    @NotNull Long durationMs,
    Long requestSize,
    Long responseSize,
    String status
) {
    public RecordTrafficRequest(String apiId, String httpMethod, String path, String clientIp,
                                Integer statusCode, Long durationMs, Long requestSize, Long responseSize, String status) {
        this(apiId, null, null, httpMethod, path, clientIp, statusCode, durationMs, requestSize, responseSize, status);
    }

    public RecordTrafficRequest(String apiId, String projectId, String httpMethod, String path, String clientIp,
                                Integer statusCode, Long durationMs, Long requestSize, Long responseSize, String status) {
        this(apiId, projectId, null, httpMethod, path, clientIp, statusCode, durationMs, requestSize, responseSize, status);
    }
}
