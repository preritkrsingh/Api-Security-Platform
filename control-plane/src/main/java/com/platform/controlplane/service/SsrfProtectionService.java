package com.platform.controlplane.service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SsrfProtectionService {

    private static final Logger log = LoggerFactory.getLogger(SsrfProtectionService.class);

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");
    private static final Set<String> CLOUD_METADATA_HOSTS = Set.of(
        "169.254.169.254",
        "metadata.google.internal",
        "instance-data",
        "100.100.100.200"
    );

    private final boolean allowLocalDevelopment;

    public SsrfProtectionService(
            @Value("${platform.security.allow-local-development:true}") boolean allowLocalDevelopment) {
        this.allowLocalDevelopment = allowLocalDevelopment;
    }

    public void validateUpstreamUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Upstream target URL cannot be null or blank");
        }

        URI uri;
        try {
            uri = URI.create(url.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URI syntax: " + e.getMessage());
        }

        String scheme = uri.getScheme();
        if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
            throw new IllegalArgumentException("Invalid URL scheme: '" + scheme + "'. Only HTTP and HTTPS are permitted.");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Upstream target URL must contain a valid host name");
        }

        if (uri.getUserInfo() != null) {
            throw new IllegalArgumentException("User credentials are not permitted in upstream URLs");
        }

        int port = uri.getPort();
        if (port != -1 && (port < 1 || port > 65535)) {
            throw new IllegalArgumentException("Port number is out of range: " + port);
        }

        // Check for cloud metadata addresses
        if (CLOUD_METADATA_HOSTS.contains(host.toLowerCase())) {
            throw new IllegalArgumentException("Access to cloud metadata endpoints is strictly forbidden (SSRF Protection).");
        }

        // DNS resolution check
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress address : addresses) {
                validateAddress(address, host);
            }
        } catch (UnknownHostException e) {
            // In containerized local environments, hostnames like 'sample-backend' may only resolve inside docker network.
            if (allowLocalDevelopment) {
                log.info("[SSRF_CHECK] Host '{}' could not be resolved locally on host; permitted under local development policy", host);
            } else {
                throw new IllegalArgumentException("Unable to resolve upstream host: " + host);
            }
        }
    }

    private void validateAddress(InetAddress address, String originalHost) {
        boolean isLoopback = address.isLoopbackAddress();
        boolean isSiteLocal = address.isSiteLocalAddress(); // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        boolean isLinkLocal = address.isLinkLocalAddress(); // 169.254.0.0/16
        boolean isMulticast = address.isMulticastAddress();
        boolean isAnyLocal = address.isAnyLocalAddress();

        String ip = address.getHostAddress();

        if (CLOUD_METADATA_HOSTS.contains(ip)) {
            throw new IllegalArgumentException("Access to cloud metadata IP (" + ip + ") is strictly prohibited.");
        }

        if (isMulticast || isAnyLocal) {
            throw new IllegalArgumentException("Multicast and unspecified addresses are prohibited: " + ip);
        }

        if (isLoopback || isSiteLocal || isLinkLocal) {
            if (allowLocalDevelopment) {
                log.warn("[SSRF_WARN] Internal/Private IP address '{}' permitted under local development policy (host: '{}')", ip, originalHost);
                return;
            }
            throw new IllegalArgumentException("Internal/Private network addresses are prohibited by SSRF security policy: " + ip);
        }
    }

    public boolean isAllowLocalDevelopment() {
        return allowLocalDevelopment;
    }
}
