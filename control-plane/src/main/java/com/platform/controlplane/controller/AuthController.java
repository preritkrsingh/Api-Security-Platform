package com.platform.controlplane.controller;

import java.util.List;

import com.platform.controlplane.dto.JwtValidationResult;
import com.platform.controlplane.dto.LoginAuthRequest;
import com.platform.controlplane.dto.TokenResponse;
import com.platform.controlplane.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final JwtService jwtService;
    private final long expirationMs;

    public AuthController(
            JwtService jwtService,
            @Value("${platform.security.jwt.expiration-ms:86400000}") long expirationMs) {
        this.jwtService = jwtService;
        this.expirationMs = expirationMs;
    }

    @PostMapping("/token")
    public ResponseEntity<TokenResponse> issueToken(@Valid @RequestBody LoginAuthRequest request) {
        return authenticateAndIssueToken(request);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginAuthRequest request) {
        return authenticateAndIssueToken(request);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.toLowerCase().startsWith("bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    JwtValidationResult.failure("MISSING_TOKEN", "Missing or invalid Authorization header. Expected 'Bearer <token>'.")
            );
        }

        String token = authHeader.substring(7).trim();
        JwtValidationResult result = jwtService.validateToken(token);
        if (!result.valid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<TokenResponse> authenticateAndIssueToken(LoginAuthRequest request) {
        String username = request.username().trim();
        String password = request.password();

        // Baseline verification for admin / developer credentials
        List<String> roles;
        if ("admin".equalsIgnoreCase(username)) {
            if ("admin123".equals(password)) {
                roles = List.of("ROLE_ADMIN", "ROLE_USER");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } else if ("developer".equalsIgnoreCase(username)) {
            if ("dev123".equals(password)) {
                roles = List.of("ROLE_DEVELOPER", "ROLE_USER");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } else if (!username.isBlank() && !password.isBlank() && password.length() >= 6) {
            // Permit tenant user authentication with standard role
            roles = List.of("ROLE_USER");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtService.generateToken(username, roles);
        TokenResponse response = new TokenResponse(
                token,
                "Bearer",
                expirationMs / 1000L,
                username,
                roles
        );

        return ResponseEntity.ok(response);
    }
}
