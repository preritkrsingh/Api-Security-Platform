package com.platform.controlplane.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginAuthRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password
) {}
