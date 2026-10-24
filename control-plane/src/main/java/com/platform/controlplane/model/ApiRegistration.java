package com.platform.controlplane.model;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "api_registrations")
public class ApiRegistration {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "project_id", length = 64, nullable = false)
    private String projectId;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "upstream_base_url", length = 500, nullable = false)
    private String upstreamBaseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "environment", length = 32, nullable = false)
    private Environment environment;

    @Column(name = "allowed_methods", length = 120, nullable = false)
    private String allowedMethods; // Comma separated: GET,POST,PUT,DELETE

    @Column(name = "allowed_path_prefix", length = 255, nullable = false)
    private String allowedPathPrefix;

    @Column(name = "connect_timeout_ms", nullable = false)
    private Integer connectTimeoutMs;

    @Column(name = "rate_limit_rps", nullable = false)
    private Integer rateLimitRps;

    @Column(name = "max_request_body_bytes", nullable = false)
    private Long maxRequestBodyBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private ProtectionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "connectivity_status", length = 32, nullable = false)
    private ConnectivityStatus connectivityStatus;

    @Column(name = "last_connectivity_check")
    private Instant lastConnectivityCheck;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ApiRegistration() {
    }

    public ApiRegistration(String projectId, String name, String upstreamBaseUrl, Environment environment) {
        this.id = "api_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        this.projectId = projectId;
        this.name = name;
        this.upstreamBaseUrl = upstreamBaseUrl;
        this.environment = environment != null ? environment : Environment.DEVELOPMENT;
        this.allowedMethods = "GET,POST,PUT,DELETE";
        this.allowedPathPrefix = "/";
        this.connectTimeoutMs = 3000;
        this.rateLimitRps = 100;
        this.maxRequestBodyBytes = 1048576L;
        this.status = ProtectionStatus.ACTIVE;
        this.connectivityStatus = ConnectivityStatus.UNTESTED;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "api_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
        if (this.allowedMethods == null || this.allowedMethods.isBlank()) {
            this.allowedMethods = "GET,POST,PUT,DELETE";
        }
        if (this.allowedPathPrefix == null || this.allowedPathPrefix.isBlank()) {
            this.allowedPathPrefix = "/";
        }
        if (this.connectTimeoutMs == null || this.connectTimeoutMs <= 0) {
            this.connectTimeoutMs = 3000;
        }
        if (this.rateLimitRps == null || this.rateLimitRps <= 0) {
            this.rateLimitRps = 100;
        }
        if (this.maxRequestBodyBytes == null || this.maxRequestBodyBytes <= 0) {
            this.maxRequestBodyBytes = 1048576L;
        }
        if (this.status == null) {
            this.status = ProtectionStatus.ACTIVE;
        }
        if (this.connectivityStatus == null) {
            this.connectivityStatus = ConnectivityStatus.UNTESTED;
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public Set<String> getAllowedMethodsSet() {
        if (allowedMethods == null || allowedMethods.isBlank()) {
            return Set.of("GET");
        }
        return Arrays.stream(allowedMethods.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
    }

    public void setAllowedMethodsSet(Set<String> methods) {
        if (methods == null || methods.isEmpty()) {
            this.allowedMethods = "GET";
        } else {
            this.allowedMethods = methods.stream()
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .sorted()
                    .collect(Collectors.joining(","));
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUpstreamBaseUrl() {
        return upstreamBaseUrl;
    }

    public void setUpstreamBaseUrl(String upstreamBaseUrl) {
        this.upstreamBaseUrl = upstreamBaseUrl;
    }

    public Environment getEnvironment() {
        return environment;
    }

    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    public String getAllowedMethods() {
        return allowedMethods;
    }

    public void setAllowedMethods(String allowedMethods) {
        this.allowedMethods = allowedMethods;
    }

    public String getAllowedPathPrefix() {
        return allowedPathPrefix;
    }

    public void setAllowedPathPrefix(String allowedPathPrefix) {
        this.allowedPathPrefix = allowedPathPrefix;
    }

    public Integer getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(Integer connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public Integer getRateLimitRps() {
        return rateLimitRps;
    }

    public void setRateLimitRps(Integer rateLimitRps) {
        this.rateLimitRps = rateLimitRps;
    }

    public Long getMaxRequestBodyBytes() {
        return maxRequestBodyBytes;
    }

    public void setMaxRequestBodyBytes(Long maxRequestBodyBytes) {
        this.maxRequestBodyBytes = maxRequestBodyBytes;
    }

    public ProtectionStatus getStatus() {
        return status;
    }

    public void setStatus(ProtectionStatus status) {
        this.status = status;
    }

    public ConnectivityStatus getConnectivityStatus() {
        return connectivityStatus;
    }

    public void setConnectivityStatus(ConnectivityStatus connectivityStatus) {
        this.connectivityStatus = connectivityStatus;
    }

    public Instant getLastConnectivityCheck() {
        return lastConnectivityCheck;
    }

    public void setLastConnectivityCheck(Instant lastConnectivityCheck) {
        this.lastConnectivityCheck = lastConnectivityCheck;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
