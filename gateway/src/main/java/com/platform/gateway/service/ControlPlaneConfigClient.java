package com.platform.gateway.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.platform.gateway.dto.GatewayApiConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class ControlPlaneConfigClient {

    private static final Logger log = LoggerFactory.getLogger(ControlPlaneConfigClient.class);

    private final WebClient webClient;
    private final long cacheTtlMs;
    private final ConcurrentHashMap<String, CachedConfig> cache = new ConcurrentHashMap<>();

    public ControlPlaneConfigClient(
            @Value("${control-plane.url:http://localhost:8082}") String controlPlaneUrl,
            @Value("${control-plane.cache-ttl-ms:5000}") long cacheTtlMs) {
        this.webClient = WebClient.builder()
                .baseUrl(controlPlaneUrl)
                .build();
        this.cacheTtlMs = cacheTtlMs;
    }

    public Mono<GatewayApiConfig> getApiConfig(String apiId) {
        CachedConfig cached = cache.get(apiId);
        long now = System.currentTimeMillis();

        if (cached != null && (now - cached.cachedAt) < cacheTtlMs) {
            return Mono.just(cached.config);
        }

        return webClient.get()
                .uri("/api/internal/apis/{apiId}", apiId)
                .retrieve()
                .bodyToMono(GatewayApiConfig.class)
                .filter(c -> c.apiId() != null && c.upstreamBaseUrl() != null)
                .doOnNext(config -> cache.put(apiId, new CachedConfig(config, System.currentTimeMillis())))
                .onErrorResume(org.springframework.web.reactive.function.client.WebClientResponseException.NotFound.class, e -> {
                    cache.remove(apiId);
                    return Mono.empty();
                })
                .onErrorResume(e -> {
                    log.warn("[CONFIG_REFRESH_FAILED] Failed to fetch config for apiId '{}': {}", apiId, e.getMessage());
                    // If cached value exists (even if slightly expired), return it as fallback
                    if (cached != null) {
                        return Mono.just(cached.config);
                    }
                    return Mono.empty();
                });
    }

    public void reportTraffic(Map<String, Object> trafficPayload) {
        webClient.post()
                .uri("/api/traffic")
                .bodyValue(trafficPayload)
                .retrieve()
                .toBodilessEntity()
                .subscribe(
                        null,
                        error -> log.debug("[TELEMETRY_REPORT_FAILED] Could not send traffic event to control plane: {}", error.getMessage())
                );
    }

    public void setCacheOverride(String apiId, GatewayApiConfig config) {
        cache.put(apiId, new CachedConfig(config, System.currentTimeMillis()));
    }

    public void clearCache(String apiId) {
        cache.remove(apiId);
    }

    private record CachedConfig(GatewayApiConfig config, long cachedAt) {}
}
