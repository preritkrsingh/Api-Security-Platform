package com.platform.controlplane.controller;

import java.util.List;

import com.platform.controlplane.dto.ApiKeyDto;
import com.platform.controlplane.dto.CreateApiKeyRequest;
import com.platform.controlplane.dto.CreateApiKeyResponse;
import com.platform.controlplane.service.ApiKeyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/apis/{apiId}/keys")
@CrossOrigin(origins = "*")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    public ResponseEntity<CreateApiKeyResponse> generateKey(
            @PathVariable String apiId,
            @Valid @RequestBody(required = false) CreateApiKeyRequest request) {
        String keyName = request != null ? request.keyName() : "Default Key";
        CreateApiKeyResponse response = apiKeyService.createKey(apiId, keyName);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<ApiKeyDto> listKeys(@PathVariable String apiId) {
        return apiKeyService.listKeys(apiId);
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Void> revokeKey(
            @PathVariable String apiId,
            @PathVariable String keyId) {
        apiKeyService.revokeKey(apiId, keyId);
        return ResponseEntity.noContent().build();
    }
}
