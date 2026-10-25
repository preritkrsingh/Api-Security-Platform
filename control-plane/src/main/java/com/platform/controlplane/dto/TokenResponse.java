package com.platform.controlplane.dto;

import java.util.List;

public record TokenResponse(
        String token,
        String tokenType,
        long expiresIn,
        String username,
        List<String> roles
) {}
