package com.platform.controlplane.dto;

import java.time.Instant;

public record TrafficRecordDto(
    String id,
    String apiId,
    String projectId,
    String requestId,
    Instant timestamp,
    String httpMethod,
    String path,
    String clientIp,
    int statusCode,
    long durationMs,
    long requestSize,
    long responseSize,
    String status
) {
    public TrafficRecordDto(String id, String apiId, Instant timestamp, String httpMethod,
                            String path, String clientIp, int statusCode, long durationMs,
                            long requestSize, long responseSize, String status) {
        this(id, apiId, null, null, timestamp, httpMethod, path, clientIp, statusCode, durationMs, requestSize, responseSize, status);
    }

    public TrafficRecordDto(String id, String apiId, String projectId, Instant timestamp, String httpMethod,
                            String path, String clientIp, int statusCode, long durationMs,
                            long requestSize, long responseSize, String status) {
        this(id, apiId, projectId, null, timestamp, httpMethod, path, clientIp, statusCode, durationMs, requestSize, responseSize, status);
    }
}
