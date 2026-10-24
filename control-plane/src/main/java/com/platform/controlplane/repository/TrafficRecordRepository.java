package com.platform.controlplane.repository;

import java.util.List;

import com.platform.controlplane.model.TrafficRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrafficRecordRepository extends JpaRepository<TrafficRecord, String> {
    List<TrafficRecord> findByApiIdOrderByTimestampDesc(String apiId, Pageable pageable);
    List<TrafficRecord> findAllByOrderByTimestampDesc(Pageable pageable);
    long countByApiId(String apiId);
    long countByApiIdAndStatusCodeLessThan(String apiId, int statusCode);
    long countByStatusCodeLessThan(int statusCode);
    void deleteByApiId(String apiId);

    List<TrafficRecord> findByProjectIdOrderByTimestampDesc(String projectId, Pageable pageable);
    long countByProjectId(String projectId);
    long countByProjectIdAndStatusCodeLessThan(String projectId, int statusCode);
    void deleteByProjectId(String projectId);
}
