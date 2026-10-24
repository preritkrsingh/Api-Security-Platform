package com.platform.controlplane.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.platform.controlplane.dto.CreateSecurityEventRequest;
import com.platform.controlplane.dto.SecurityEventDto;
import com.platform.controlplane.model.SecurityEvent;
import com.platform.controlplane.model.Severity;
import com.platform.controlplane.model.ThreatType;
import com.platform.controlplane.repository.SecurityEventRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecurityEventService {

    private final SecurityEventRepository securityEventRepository;

    public SecurityEventService(SecurityEventRepository securityEventRepository) {
        this.securityEventRepository = securityEventRepository;
    }

    @PostConstruct
    public void initBaselineTelemetry() {
        if (securityEventRepository.count() == 0) {
            SecurityEvent baseline = new SecurityEvent(
                    "evt-" + UUID.randomUUID(),
                    Instant.now().minusSeconds(120),
                    "192.168.1.100",
                    "/api/demo/resource",
                    "GET",
                    ThreatType.ANOMALOUS_VELOCITY,
                    Severity.LOW,
                    0.35,
                    "Baseline velocity check: 25 req/min"
            );
            securityEventRepository.save(baseline);
        }
    }

    @Transactional(readOnly = true)
    public List<SecurityEventDto> findAll(Severity severity, int limit) {
        return findAll(null, severity, limit);
    }

    @Transactional(readOnly = true)
    public List<SecurityEventDto> findAll(String projectId, Severity severity, int limit) {
        int safeLimit = limit <= 0 ? 50 : Math.min(limit, 500);
        PageRequest pageRequest = PageRequest.of(0, safeLimit);

        List<SecurityEvent> events;
        if (projectId != null && !projectId.isBlank()) {
            if (severity == null) {
                events = securityEventRepository.findByProjectIdOrderByTimestampDesc(projectId, pageRequest);
            } else {
                events = securityEventRepository.findByProjectIdAndSeverityOrderByTimestampDesc(projectId, severity, pageRequest);
            }
        } else {
            if (severity == null) {
                events = securityEventRepository.findAllByOrderByTimestampDesc(pageRequest);
            } else {
                events = securityEventRepository.findBySeverityOrderByTimestampDesc(severity, pageRequest);
            }
        }

        return events.stream().map(this::toDto).toList();
    }

    @Transactional
    public SecurityEventDto create(CreateSecurityEventRequest request) {
        SecurityEvent event = new SecurityEvent(
                request.projectId(),
                request.apiId(),
                request.clientIp(),
                request.uriPath(),
                request.httpMethod(),
                request.threatType(),
                request.severity(),
                request.riskScore(),
                request.details() != null ? request.details() : ""
        );
        event = securityEventRepository.save(event);
        return toDto(event);
    }

    @Transactional
    public SecurityEventDto recordEvent(String clientIp, String uriPath, String httpMethod,
                                        ThreatType threatType, Severity severity, Double riskScore, String details) {
        return recordEvent(null, null, clientIp, uriPath, httpMethod, threatType, severity, riskScore, details);
    }

    @Transactional
    public SecurityEventDto recordEvent(String projectId, String apiId, String clientIp, String uriPath, String httpMethod,
                                        ThreatType threatType, Severity severity, Double riskScore, String details) {
        SecurityEvent event = new SecurityEvent(
                projectId,
                apiId,
                clientIp,
                uriPath,
                httpMethod,
                threatType,
                severity,
                riskScore,
                details
        );
        event = securityEventRepository.save(event);
        return toDto(event);
    }

    private SecurityEventDto toDto(SecurityEvent e) {
        return new SecurityEventDto(
                e.getId(),
                e.getProjectId(),
                e.getApiId(),
                e.getTimestamp(),
                e.getClientIp(),
                e.getUriPath(),
                e.getHttpMethod(),
                e.getThreatType(),
                e.getSeverity(),
                e.getRiskScore(),
                e.getDetails()
        );
    }
}
