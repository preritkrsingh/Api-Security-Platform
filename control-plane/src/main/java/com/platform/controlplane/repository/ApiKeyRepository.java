package com.platform.controlplane.repository;

import java.util.List;
import java.util.Optional;

import com.platform.controlplane.model.ApiKey;
import com.platform.controlplane.model.KeyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
    List<ApiKey> findByApiId(String apiId);
    Optional<ApiKey> findByApiIdAndKeyHashAndStatus(String apiId, String keyHash, KeyStatus status);
    void deleteByApiId(String apiId);
}
