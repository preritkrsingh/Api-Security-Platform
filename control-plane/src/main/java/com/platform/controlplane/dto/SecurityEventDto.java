package com.platform.controlplane.dto;

import java.time.Instant;

import com.platform.controlplane.model.Severity;
import com.platform.controlplane.model.ThreatType;

public record SecurityEventDto(
    String id,
    String projectId,
    String apiId,
    Instant timestamp,
    String clientIp,
    String uriPath,
    String httpMethod,
    ThreatType threatType,
    Severity severity,
    Double riskScore,
    String details
) {
    public SecurityEventDto(String id, Instant timestamp, String clientIp, String uriPath,
                            String httpMethod, ThreatType threatType, Severity severity,
                            Double riskScore, String details) {
        this(id, null, null, timestamp, clientIp, uriPath, httpMethod, threatType, severity, riskScore, details);
    }
}
