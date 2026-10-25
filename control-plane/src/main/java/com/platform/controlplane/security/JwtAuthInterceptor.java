package com.platform.controlplane.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.controlplane.dto.JwtValidationResult;
import com.platform.controlplane.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final boolean enforceManagement;

    public JwtAuthInterceptor(
            JwtService jwtService,
            ObjectMapper objectMapper,
            @Value("${platform.security.jwt.enforce-management:false}") boolean enforceManagement) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.enforceManagement = enforceManagement;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Skip CORS preflights
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();

        // Explicitly defined public routes
        if (isPublicRoute(path)) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");

        // If a Bearer token is provided, validate it strictly
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            String token = authHeader.substring(7).trim();
            JwtValidationResult result = jwtService.validateToken(token);

            if (!result.valid()) {
                writeError(response, HttpStatus.UNAUTHORIZED, result.errorCode(), result.errorMessage(), path);
                return false;
            }

            // Role-based authorization for administrative operations (e.g. destructive actions)
            if ("DELETE".equalsIgnoreCase(request.getMethod()) && !result.roles().contains("ROLE_ADMIN")) {
                writeError(response, HttpStatus.FORBIDDEN, "FORBIDDEN",
                        "User '" + result.username() + "' does not possess required administrative permissions for this operation.", path);
                return false;
            }

            request.setAttribute("currentUser", result.username());
            request.setAttribute("userRoles", result.roles());
            return true;
        }

        // If management enforcement is enabled and no token is present, reject
        if (enforceManagement && isManagementRoute(path)) {
            writeError(response, HttpStatus.UNAUTHORIZED, "MISSING_TOKEN",
                    "Authentication is required. Provide a valid Bearer token.", path);
            return false;
        }

        return true;
    }

    private boolean isPublicRoute(String path) {
        return path.startsWith("/actuator")
                || path.startsWith("/api/control/health")
                || path.startsWith("/api/auth")
                || path.startsWith("/api/internal")
                || path.equals("/api/traffic")
                || path.startsWith("/error");
    }

    private boolean isManagementRoute(String path) {
        return path.startsWith("/api/projects")
                || path.startsWith("/api/apis");
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String errorCode, String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        Map<String, Object> errorPayload = Map.of(
                "error", errorCode,
                "message", message,
                "path", path,
                "timestamp", Instant.now().toString()
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorPayload));
    }
}
