package com.platform.controlplane.dto;

import java.util.List;
import java.util.Map;

public record JwtValidationResult(
        boolean valid,
        String username,
        List<String> roles,
        Map<String, Object> claims,
        String errorCode,
        String errorMessage
) {
    public static JwtValidationResult success(String username, List<String> roles, Map<String, Object> claims) {
        return new JwtValidationResult(true, username, roles, claims, null, null);
    }

    public static JwtValidationResult failure(String errorCode, String errorMessage) {
        return new JwtValidationResult(false, null, List.of(), Map.of(), errorCode, errorMessage);
    }
}
