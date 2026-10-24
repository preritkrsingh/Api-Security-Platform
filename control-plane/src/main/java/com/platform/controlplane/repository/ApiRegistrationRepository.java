package com.platform.controlplane.repository;

import java.util.List;

import com.platform.controlplane.model.ApiRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiRegistrationRepository extends JpaRepository<ApiRegistration, String> {
    List<ApiRegistration> findByProjectId(String projectId);
    boolean existsByProjectIdAndName(String projectId, String name);
    void deleteByProjectId(String projectId);
}
