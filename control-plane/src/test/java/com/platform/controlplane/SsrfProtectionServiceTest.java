package com.platform.controlplane;

import com.platform.controlplane.service.SsrfProtectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SsrfProtectionServiceTest {

    @Test
    @DisplayName("Should accept valid HTTP and HTTPS URLs")
    void testValidUrls() {
        SsrfProtectionService devService = new SsrfProtectionService(true);
        assertDoesNotThrow(() -> devService.validateUpstreamUrl("http://localhost:8081"));
        assertDoesNotThrow(() -> devService.validateUpstreamUrl("https://api.github.com"));
        assertDoesNotThrow(() -> devService.validateUpstreamUrl("http://sample-backend:8081/api"));
    }

    @Test
    @DisplayName("Should reject invalid or dangerous schemes")
    void testInvalidSchemes() {
        SsrfProtectionService service = new SsrfProtectionService(true);
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl("ftp://files.example.com"));
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl("file:///etc/passwd"));
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl("gopher://127.0.0.1:70/"));
    }

    @Test
    @DisplayName("Should reject cloud metadata addresses unconditionally")
    void testCloudMetadataProtection() {
        SsrfProtectionService service = new SsrfProtectionService(true);
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl("http://169.254.169.254/latest/meta-data/"));
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl("http://metadata.google.internal/computeMetadata/v1/"));
    }

    @Test
    @DisplayName("Should reject internal IP addresses when local development is disabled")
    void testStrictProductionSsrf() {
        SsrfProtectionService prodService = new SsrfProtectionService(false);
        assertThrows(IllegalArgumentException.class, () -> prodService.validateUpstreamUrl("http://127.0.0.1:8080"));
        assertThrows(IllegalArgumentException.class, () -> prodService.validateUpstreamUrl("http://10.0.0.1/admin"));
        assertThrows(IllegalArgumentException.class, () -> prodService.validateUpstreamUrl("http://192.168.1.1/router"));
    }

    @Test
    @DisplayName("Should reject blank or null URLs")
    void testBlankUrls() {
        SsrfProtectionService service = new SsrfProtectionService(true);
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl(""));
        assertThrows(IllegalArgumentException.class, () -> service.validateUpstreamUrl(null));
    }
}
