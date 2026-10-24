package com.platform.controlplane.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(name = "api_id", length = 64)
    private String apiId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "client_ip", length = 64, nullable = false)
    private String clientIp;

    @Column(name = "uri_path", length = 500, nullable = false)
    private String uriPath;

    @Column(name = "http_method", length = 16, nullable = false)
    private String httpMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "threat_type", length = 64, nullable = false)
    private ThreatType threatType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 32, nullable = false)
    private Severity severity;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Column(name = "details", length = 1000)
    private String details;

    public SecurityEvent() {
    }

    public SecurityEvent(String clientIp, String uriPath, String httpMethod,
                         ThreatType threatType, Severity severity, Double riskScore, String details) {
        this((String) null, (String) null, clientIp, uriPath, httpMethod, threatType, severity, riskScore, details);
    }

    public SecurityEvent(String projectId, String apiId, String clientIp, String uriPath, String httpMethod,
                         ThreatType threatType, Severity severity, Double riskScore, String details) {
        this.id = "evt-" + UUID.randomUUID().toString();
        this.projectId = projectId;
        this.apiId = apiId;
        this.timestamp = Instant.now();
        this.clientIp = clientIp != null ? clientIp : "UNKNOWN";
        this.uriPath = uriPath != null ? uriPath : "/";
        this.httpMethod = httpMethod != null ? httpMethod : "GET";
        this.threatType = threatType != null ? threatType : ThreatType.UNSPECIFIED_ANOMALY;
        this.severity = severity != null ? severity : Severity.LOW;
        this.riskScore = riskScore != null ? riskScore : 0.0;
        this.details = details != null ? details : "";
    }

    public SecurityEvent(String id, Instant timestamp, String clientIp, String uriPath, String httpMethod,
                         ThreatType threatType, Severity severity, Double riskScore, String details) {
        this.id = id != null ? id : "evt-" + UUID.randomUUID().toString();
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.clientIp = clientIp != null ? clientIp : "UNKNOWN";
        this.uriPath = uriPath != null ? uriPath : "/";
        this.httpMethod = httpMethod != null ? httpMethod : "GET";
        this.threatType = threatType != null ? threatType : ThreatType.UNSPECIFIED_ANOMALY;
        this.severity = severity != null ? severity : Severity.LOW;
        this.riskScore = riskScore != null ? riskScore : 0.0;
        this.details = details != null ? details : "";
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "evt-" + UUID.randomUUID().toString();
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getApiId() {
        return apiId;
    }

    public void setApiId(String apiId) {
        this.apiId = apiId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getUriPath() {
        return uriPath;
    }

    public void setUriPath(String uriPath) {
        this.uriPath = uriPath;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public ThreatType getThreatType() {
        return threatType;
    }

    public void setThreatType(ThreatType threatType) {
        this.threatType = threatType;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
