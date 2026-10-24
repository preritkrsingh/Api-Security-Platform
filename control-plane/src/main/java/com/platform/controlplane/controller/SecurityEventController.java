package com.platform.controlplane.controller;

import java.util.List;

import com.platform.controlplane.dto.CreateSecurityEventRequest;
import com.platform.controlplane.dto.SecurityEventDto;
import com.platform.controlplane.model.Severity;
import com.platform.controlplane.service.SecurityEventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/security-events")
public class SecurityEventController {

    private final SecurityEventService eventService;

    public SecurityEventController(SecurityEventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<SecurityEventDto> listEvents(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) Severity severity,
            @RequestParam(defaultValue = "50") int limit) {
        return eventService.findAll(projectId, severity, limit);
    }

    @PostMapping
    public ResponseEntity<SecurityEventDto> recordEvent(@Valid @RequestBody CreateSecurityEventRequest request) {
        SecurityEventDto created = eventService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
