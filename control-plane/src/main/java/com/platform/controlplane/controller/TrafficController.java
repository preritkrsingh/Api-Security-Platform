package com.platform.controlplane.controller;

import java.util.List;

import com.platform.controlplane.dto.RecordTrafficRequest;
import com.platform.controlplane.dto.TrafficRecordDto;
import com.platform.controlplane.dto.TrafficSummaryDto;
import com.platform.controlplane.service.TrafficService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class TrafficController {

    private final TrafficService trafficService;

    public TrafficController(TrafficService trafficService) {
        this.trafficService = trafficService;
    }

    @PostMapping("/api/traffic")
    public ResponseEntity<TrafficRecordDto> recordTraffic(@Valid @RequestBody RecordTrafficRequest request) {
        TrafficRecordDto saved = trafficService.recordTraffic(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/api/traffic")
    public ResponseEntity<List<TrafficRecordDto>> getAllRecentTraffic(
            @RequestParam(required = false) String projectId,
            @RequestParam(defaultValue = "200") int limit) {
        long total = trafficService.countTraffic(projectId);
        List<TrafficRecordDto> records = trafficService.getAllRecentTraffic(projectId, limit);
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total))
                .header("Access-Control-Expose-Headers", "X-Total-Count")
                .body(records);
    }

    @GetMapping("/api/traffic/summary")
    public TrafficSummaryDto getOverallTrafficSummary(
            @RequestParam(required = false) String projectId,
            @RequestParam(defaultValue = "100") int limit) {
        if (projectId != null && !projectId.isBlank()) {
            return trafficService.getProjectTrafficSummary(projectId, limit);
        }
        return trafficService.getGlobalTrafficSummary(limit);
    }

    @GetMapping("/api/projects/{projectId}/traffic")
    public ResponseEntity<List<TrafficRecordDto>> getProjectTraffic(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "200") int limit) {
        long total = trafficService.countTraffic(projectId);
        List<TrafficRecordDto> records = trafficService.getAllRecentTraffic(projectId, limit);
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total))
                .header("Access-Control-Expose-Headers", "X-Total-Count")
                .body(records);
    }

    @GetMapping("/api/projects/{projectId}/traffic/summary")
    public TrafficSummaryDto getProjectTrafficSummary(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "100") int limit) {
        return trafficService.getProjectTrafficSummary(projectId, limit);
    }

    @GetMapping("/api/apis/{apiId}/traffic")
    public TrafficSummaryDto getTrafficSummary(
            @PathVariable String apiId,
            @RequestParam(defaultValue = "50") int limit) {
        return trafficService.getTrafficSummary(apiId, limit);
    }
}
