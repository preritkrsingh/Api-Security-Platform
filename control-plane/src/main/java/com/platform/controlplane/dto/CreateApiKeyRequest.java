package com.platform.controlplane.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateApiKeyRequest(
    @NotBlank(message = "Key name cannot be blank")
    @Size(min = 2, max = 120, message = "Key name must be between 2 and 120 characters")
    String keyName
) {}
