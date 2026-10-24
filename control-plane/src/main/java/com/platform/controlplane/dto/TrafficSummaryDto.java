package com.platform.controlplane.dto;

import java.util.List;

public record TrafficSummaryDto(
    String apiId,
    long totalRequests,
    long successCount,
    long errorCount,
    double avgDurationMs,
    List<TrafficRecordDto> recentRequests
) {}
