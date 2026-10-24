package com.platform.controlplane.repository;

import java.util.List;

import com.platform.controlplane.model.SecurityEvent;
import com.platform.controlplane.model.Severity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, String> {

    List<SecurityEvent> findAllByOrderByTimestampDesc(Pageable pageable);

    List<SecurityEvent> findBySeverityOrderByTimestampDesc(Severity severity, Pageable pageable);

    long countBySeverity(Severity severity);

    List<SecurityEvent> findByProjectIdOrderByTimestampDesc(String projectId, Pageable pageable);

    List<SecurityEvent> findByProjectIdAndSeverityOrderByTimestampDesc(String projectId, Severity severity, Pageable pageable);

    long countByProjectId(String projectId);

    void deleteByProjectId(String projectId);
}
