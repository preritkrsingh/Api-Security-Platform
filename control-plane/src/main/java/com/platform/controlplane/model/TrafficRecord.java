package com.platform.controlplane.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "traffic_records")
public class TrafficRecord {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(name = "api_id", length = 64, nullable = false)
    private String apiId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "http_method", length = 16, nullable = false)
    private String httpMethod;

    @Column(name = "path", length = 500, nullable = false)
    private String path;

    @Column(name = "client_ip", length = 64, nullable = false)
    private String clientIp;

    @Column(name = "status_code", nullable = false)
    private Integer statusCode;

    @Column(name = "duration_ms", nullable = false)
    private Long durationMs;

    @Column(name = "request_size", nullable = false)
    private Long requestSize;

    @Column(name = "response_size", nullable = false)
    private Long responseSize;

    @Column(name = "status", length = 32, nullable = false)
    private String status;

    public TrafficRecord() {
    }

    public TrafficRecord(String apiId, String httpMethod, String path, String clientIp,
                         Integer statusCode, Long durationMs, Long requestSize, Long responseSize, String status) {
        this(apiId, null, httpMethod, path, clientIp, statusCode, durationMs, requestSize, responseSize, status);
    }

    public TrafficRecord(String apiId, String projectId, String httpMethod, String path, String clientIp,
                         Integer statusCode, Long durationMs, Long requestSize, Long responseSize, String status) {
        this.id = "trf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        this.apiId = apiId;
        this.projectId = projectId;
        this.timestamp = Instant.now();
        this.httpMethod = httpMethod;
        this.path = path;
        this.clientIp = clientIp != null ? clientIp : "UNKNOWN";
        this.statusCode = statusCode != null ? statusCode : 0;
        this.durationMs = durationMs != null ? durationMs : 0L;
        this.requestSize = requestSize != null ? requestSize : 0L;
        this.responseSize = responseSize != null ? responseSize : 0L;
        this.status = status != null ? status : "UNKNOWN";
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "trf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    // Getters and Setters

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

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public Long getRequestSize() {
        return requestSize;
    }

    public void setRequestSize(Long requestSize) {
        this.requestSize = requestSize;
    }

    public Long getResponseSize() {
        return responseSize;
    }

    public void setResponseSize(Long responseSize) {
        this.responseSize = responseSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
