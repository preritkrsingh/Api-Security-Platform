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
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "api_id", length = 64, nullable = false)
    private String apiId;

    @Column(name = "key_name", length = 120, nullable = false)
    private String keyName;

    @Column(name = "key_prefix", length = 32, nullable = false)
    private String keyPrefix;

    @Column(name = "key_hash", length = 128, nullable = false)
    private String keyHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private KeyStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public ApiKey() {
    }

    public ApiKey(String apiId, String keyName, String keyPrefix, String keyHash) {
        this.id = "key_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        this.apiId = apiId;
        this.keyName = keyName;
        this.keyPrefix = keyPrefix;
        this.keyHash = keyHash;
        this.status = KeyStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "key_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
        if (this.status == null) {
            this.status = KeyStatus.ACTIVE;
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getApiId() {
        return apiId;
    }

    public void setApiId(String apiId) {
        this.apiId = apiId;
    }

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public void setKeyPrefix(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public String getKeyHash() {
        return keyHash;
    }

    public void setKeyHash(String keyHash) {
        this.keyHash = keyHash;
    }

    public KeyStatus getStatus() {
        return status;
    }

    public void setStatus(KeyStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }
}
