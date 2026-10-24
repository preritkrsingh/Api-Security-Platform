package com.platform.controlplane.controller;

import com.platform.controlplane.dto.GatewayApiValidationDto;
import com.platform.controlplane.service.ApiRegistrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/apis")
public class InternalApiController {

    private final ApiRegistrationService apiService;

    public InternalApiController(ApiRegistrationService apiService) {
        this.apiService = apiService;
    }

    @GetMapping("/{apiId}")
    public GatewayApiValidationDto getGatewayValidation(@PathVariable String apiId) {
        return apiService.getGatewayValidation(apiId);
    }
}
