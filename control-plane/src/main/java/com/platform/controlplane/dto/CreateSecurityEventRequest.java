package com.platform.controlplane.dto;

import com.platform.controlplane.model.Severity;
import com.platform.controlplane.model.ThreatType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSecurityEventRequest(
    @NotBlank(message = "clientIp must not be blank")
    String clientIp,

    String projectId,

    String apiId,

    @NotBlank(message = "uriPath must not be blank")
    String uriPath,

    @NotBlank(message = "httpMethod must not be blank")
    String httpMethod,

    @NotNull(message = "threatType must be specified")
    ThreatType threatType,

    @NotNull(message = "severity must be specified")
    Severity severity,

    @NotNull(message = "riskScore must be specified")
    @DecimalMin(value = "0.0", message = "riskScore must be greater than or equal to 0.0")
    @DecimalMax(value = "1.0", message = "riskScore must be less than or equal to 1.0")
    Double riskScore,

    String details
) {
    public CreateSecurityEventRequest(String clientIp, String uriPath, String httpMethod,
                                      ThreatType threatType, Severity severity, Double riskScore, String details) {
        this(clientIp, null, null, uriPath, httpMethod, threatType, severity, riskScore, details);
    }
}
