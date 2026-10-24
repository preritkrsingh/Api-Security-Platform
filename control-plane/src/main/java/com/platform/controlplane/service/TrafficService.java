package com.platform.controlplane.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.platform.controlplane.dto.RecordTrafficRequest;
import com.platform.controlplane.dto.TrafficRecordDto;
import com.platform.controlplane.dto.TrafficSummaryDto;
import com.platform.controlplane.model.ApiRegistration;
import com.platform.controlplane.model.Severity;
import com.platform.controlplane.model.ThreatType;
import com.platform.controlplane.model.TrafficRecord;
import com.platform.controlplane.repository.ApiRegistrationRepository;
import com.platform.controlplane.repository.TrafficRecordRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrafficService {

    private final TrafficRecordRepository trafficRecordRepository;
    private final ApiRegistrationRepository apiRegistrationRepository;
    private final SecurityEventService securityEventService;

    public TrafficService(
            TrafficRecordRepository trafficRecordRepository,
            ApiRegistrationRepository apiRegistrationRepository,
            SecurityEventService securityEventService) {
        this.trafficRecordRepository = trafficRecordRepository;
        this.apiRegistrationRepository = apiRegistrationRepository;
        this.securityEventService = securityEventService;
    }

    @PostConstruct
    @Transactional
    public void backfillMissingProjectIds() {
        try {
            List<TrafficRecord> unassigned = trafficRecordRepository.findAll().stream()
                    .filter(t -> t.getProjectId() == null || t.getProjectId().isBlank())
                    .toList();
            for (TrafficRecord t : unassigned) {
                if (t.getApiId() != null) {
                    apiRegistrationRepository.findById(t.getApiId()).ifPresent(api -> {
                        t.setProjectId(api.getProjectId());
                        trafficRecordRepository.save(t);
                    });
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional
    public TrafficRecordDto recordTraffic(RecordTrafficRequest request) {
        String resolvedProjectId = request.projectId();
        if ((resolvedProjectId == null || resolvedProjectId.isBlank()) && request.apiId() != null) {
            resolvedProjectId = apiRegistrationRepository.findById(request.apiId())
                    .map(ApiRegistration::getProjectId)
                    .orElse(null);
        }

        TrafficRecord record = new TrafficRecord(
                request.apiId(),
                resolvedProjectId,
                request.httpMethod(),
                request.path(),
                request.clientIp(),
                request.statusCode(),
                request.durationMs(),
                request.requestSize(),
                request.responseSize(),
                request.status()
        );
        record = trafficRecordRepository.save(record);

        // Record immediate security event if request was rejected by gateway perimeter
        if (request.statusCode() == 429) {
            securityEventService.recordEvent(
                    resolvedProjectId,
                    request.apiId(),
                    request.clientIp(),
                    request.path(),
                    request.httpMethod(),
                    ThreatType.RATE_LIMIT_EXCEEDED,
                    Severity.HIGH,
                    0.85,
                    "Gateway token bucket rate limit triggered: excessive request velocity."
            );
        } else if (request.statusCode() == 401) {
            securityEventService.recordEvent(
                    resolvedProjectId,
                    request.apiId(),
                    request.clientIp(),
                    request.path(),
                    request.httpMethod(),
                    ThreatType.CREDENTIAL_STUFFING,
                    Severity.HIGH,
                    0.80,
                    "Gateway perimeter rejected unauthorized request (missing or invalid API key)."
            );
        } else if (request.statusCode() == 403 && "BLOCKED".equalsIgnoreCase(request.status())) {
            securityEventService.recordEvent(
                    resolvedProjectId,
                    request.apiId(),
                    request.clientIp(),
                    request.path(),
                    request.httpMethod(),
                    ThreatType.UNAUTHORIZED_ACCESS,
                    Severity.MEDIUM,
                    0.60,
                    "Gateway blocked request: API inactive or path prefix forbidden."
            );
        }

        return toDto(record);
    }

    @Transactional(readOnly = true)
    public TrafficSummaryDto getTrafficSummary(String apiId, int limit) {
        int safeLimit = limit <= 0 ? 50 : Math.min(limit, 500);
        List<TrafficRecord> recent = trafficRecordRepository.findByApiIdOrderByTimestampDesc(
                apiId, PageRequest.of(0, safeLimit));

        long total = trafficRecordRepository.countByApiId(apiId);
        long successCount = trafficRecordRepository.countByApiIdAndStatusCodeLessThan(apiId, 400);
        long errorCount = Math.max(0, total - successCount);

        double avgDuration = recent.isEmpty() ? 0.0 :
                recent.stream().mapToLong(TrafficRecord::getDurationMs).average().orElse(0.0);

        List<TrafficRecordDto> recordDtos = recent.stream().map(this::toDto).toList();

        return new TrafficSummaryDto(
                apiId,
                total,
                successCount,
                errorCount,
                Math.round(avgDuration * 100.0) / 100.0,
                recordDtos
        );
    }

    @Transactional(readOnly = true)
    public long countTraffic(String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return trafficRecordRepository.countByProjectId(projectId);
        }
        return trafficRecordRepository.count();
    }

    @Transactional(readOnly = true)
    public TrafficSummaryDto getGlobalTrafficSummary(int limit) {
        int safeLimit = limit <= 0 ? 100 : Math.min(limit, 1000);
        List<TrafficRecord> recent = trafficRecordRepository.findAllByOrderByTimestampDesc(
                PageRequest.of(0, safeLimit));

        long total = trafficRecordRepository.count();
        long successCount = trafficRecordRepository.countByStatusCodeLessThan(400);
        long errorCount = Math.max(0, total - successCount);

        double avgDuration = recent.isEmpty() ? 0.0 :
                recent.stream().mapToLong(TrafficRecord::getDurationMs).average().orElse(0.0);

        List<TrafficRecordDto> recordDtos = recent.stream().map(this::toDto).toList();

        return new TrafficSummaryDto(
                "GLOBAL",
                total,
                successCount,
                errorCount,
                Math.round(avgDuration * 100.0) / 100.0,
                recordDtos
        );
    }

    @Transactional(readOnly = true)
    public TrafficSummaryDto getProjectTrafficSummary(String projectId, int limit) {
        int safeLimit = limit <= 0 ? 100 : Math.min(limit, 1000);
        List<TrafficRecord> recent = trafficRecordRepository.findByProjectIdOrderByTimestampDesc(
                projectId, PageRequest.of(0, safeLimit));

        long total = trafficRecordRepository.countByProjectId(projectId);
        long successCount = trafficRecordRepository.countByProjectIdAndStatusCodeLessThan(projectId, 400);
        long errorCount = Math.max(0, total - successCount);

        double avgDuration = recent.isEmpty() ? 0.0 :
                recent.stream().mapToLong(TrafficRecord::getDurationMs).average().orElse(0.0);

        List<TrafficRecordDto> recordDtos = recent.stream().map(this::toDto).toList();

        return new TrafficSummaryDto(
                projectId,
                total,
                successCount,
                errorCount,
                Math.round(avgDuration * 100.0) / 100.0,
                recordDtos
        );
    }

    @Transactional(readOnly = true)
    public List<TrafficRecordDto> getAllRecentTraffic(int limit) {
        return getAllRecentTraffic(null, limit);
    }

    @Transactional(readOnly = true)
    public List<TrafficRecordDto> getAllRecentTraffic(String projectId, int limit) {
        int safeLimit = limit <= 0 ? 100 : Math.min(limit, 1000);
        List<TrafficRecord> recent;
        if (projectId != null && !projectId.isBlank()) {
            recent = trafficRecordRepository.findByProjectIdOrderByTimestampDesc(
                    projectId, PageRequest.of(0, safeLimit));
        } else {
            recent = trafficRecordRepository.findAllByOrderByTimestampDesc(
                    PageRequest.of(0, safeLimit));
        }
        return recent.stream().map(this::toDto).toList();
    }

    private TrafficRecordDto toDto(TrafficRecord r) {
        return new TrafficRecordDto(
                r.getId(),
                r.getApiId(),
                r.getProjectId(),
                r.getTimestamp(),
                r.getHttpMethod(),
                r.getPath(),
                r.getClientIp(),
                r.getStatusCode(),
                r.getDurationMs(),
                r.getRequestSize(),
                r.getResponseSize(),
                r.getStatus()
        );
    }
}
