package com.platform.controlplane.controller;

import java.util.List;

import com.platform.controlplane.dto.ApiRegistrationDto;
import com.platform.controlplane.dto.ConnectivityTestResult;
import com.platform.controlplane.dto.CreateApiRegistrationRequest;
import com.platform.controlplane.dto.UpdateApiRegistrationRequest;
import com.platform.controlplane.service.ApiRegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class ApiRegistrationController {

    private final ApiRegistrationService apiService;

    public ApiRegistrationController(ApiRegistrationService apiService) {
        this.apiService = apiService;
    }

    @PostMapping("/api/projects/{projectId}/apis")
    public ResponseEntity<ApiRegistrationDto> registerApi(
            @PathVariable String projectId,
            @Valid @RequestBody CreateApiRegistrationRequest request) {
        ApiRegistrationDto created = apiService.create(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/api/projects/{projectId}/apis")
    public List<ApiRegistrationDto> listApisForProject(@PathVariable String projectId) {
        return apiService.findByProjectId(projectId);
    }

    @GetMapping("/api/apis")
    public List<ApiRegistrationDto> listAllApis() {
        return apiService.findAll();
    }

    @GetMapping("/api/apis/{apiId}")
    public ApiRegistrationDto getApi(@PathVariable String apiId) {
        return apiService.findById(apiId);
    }

    @PutMapping("/api/apis/{apiId}")
    public ApiRegistrationDto updateApi(
            @PathVariable String apiId,
            @Valid @RequestBody UpdateApiRegistrationRequest request) {
        return apiService.update(apiId, request);
    }

    @DeleteMapping("/api/apis/{apiId}")
    public ResponseEntity<Void> deleteApi(@PathVariable String apiId) {
        apiService.delete(apiId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/apis/{apiId}/activate")
    public ApiRegistrationDto activateApi(@PathVariable String apiId) {
        return apiService.activate(apiId);
    }

    @PostMapping("/api/apis/{apiId}/deactivate")
    public ApiRegistrationDto deactivateApi(@PathVariable String apiId) {
        return apiService.deactivate(apiId);
    }

    @PostMapping("/api/apis/{apiId}/test-connection")
    public ConnectivityTestResult testConnection(@PathVariable String apiId) {
        return apiService.testConnectivity(apiId);
    }
}
