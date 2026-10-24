package com.platform.gateway.filter;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.gateway.dto.GatewayApiConfig;
import com.platform.gateway.service.ControlPlaneConfigClient;
import com.platform.gateway.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class DynamicProxyFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DynamicProxyFilter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ControlPlaneConfigClient configClient;
    private final RateLimiterService rateLimiterService;

    public DynamicProxyFilter(
            ControlPlaneConfigClient configClient,
            RateLimiterService rateLimiterService) {
        this.configClient = configClient;
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getRawPath();

        // Only handle requests targeting the dynamic proxy endpoint: /proxy/{apiId}/**
        if (!path.startsWith("/proxy/")) {
            return chain.filter(exchange);
        }

        // Allow CORS preflight requests to proceed without authentication
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        // Parse apiId and subpath
        String afterProxy = path.substring("/proxy/".length());
        int slashIndex = afterProxy.indexOf('/');
        String apiId;
        String subpath;

        if (slashIndex == -1) {
            apiId = afterProxy;
            subpath = "/";
        } else {
            apiId = afterProxy.substring(0, slashIndex);
            subpath = afterProxy.substring(slashIndex);
        }

        if (apiId.isBlank()) {
            return writeErrorResponse(exchange, HttpStatus.NOT_FOUND, "API_NOT_FOUND",
                    "No API ID specified in proxy path.");
        }

        if ("actuator".equalsIgnoreCase(apiId) || "health".equalsIgnoreCase(apiId)) {
            return writeHealthResponse(exchange);
        }

        long startTime = System.currentTimeMillis();

        return configClient.getApiConfig(apiId)
                .switchIfEmpty(Mono.defer(() ->
                    writeErrorResponse(exchange, HttpStatus.NOT_FOUND, "API_NOT_FOUND",
                            "Registered API '" + apiId + "' was not found or is no longer configured.")
                        .then(Mono.empty())
                ))
                .flatMap(config -> handleProxyRequest(exchange, chain, config, apiId, subpath, startTime));
    }

    private Mono<Void> handleProxyRequest(ServerWebExchange exchange, GatewayFilterChain chain,
                                         GatewayApiConfig config, String apiId, String subpath, long startTime) {
        // 1. Status Check
        if (config.status() == null || !"ACTIVE".equalsIgnoreCase(config.status())) {
            return writeBlockedResponse(exchange, HttpStatus.FORBIDDEN, "API_INACTIVE",
                    "This registered API is currently disabled or inactive.", apiId, subpath, startTime);
        }

        // 2. Authentication Check
        String apiKey = resolveApiKey(exchange.getRequest());
        if (apiKey == null || apiKey.isBlank()) {
            return writeBlockedResponse(exchange, HttpStatus.UNAUTHORIZED, "MISSING_API_KEY",
                    "A valid 'X-API-Key' header is required to access this protected API.", apiId, subpath, startTime);
        }

        String keyHash = hashKey(apiKey);
        if (config.activeKeyHashes() == null || !config.activeKeyHashes().contains(keyHash)) {
            return writeBlockedResponse(exchange, HttpStatus.UNAUTHORIZED, "INVALID_API_KEY",
                    "The provided API key is invalid or has been revoked.", apiId, subpath, startTime);
        }

        // 3. HTTP Method Enforcement
        String method = exchange.getRequest().getMethod().name();
        if (config.allowedMethods() != null && !config.allowedMethods().isEmpty()
                && !config.allowedMethods().contains(method)) {
            return writeBlockedResponse(exchange, HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                    "HTTP method '" + method + "' is not permitted for this API. Allowed: " + config.allowedMethods(), apiId, subpath, startTime);
        }

        // 4. Path Prefix Enforcement
        String prefix = config.allowedPathPrefix() != null ? config.allowedPathPrefix() : "/";
        if (!prefix.equals("/") && !subpath.startsWith(prefix)) {
            return writeBlockedResponse(exchange, HttpStatus.FORBIDDEN, "PATH_PREFIX_FORBIDDEN",
                    "Request path '" + subpath + "' does not match allowed prefix '" + prefix + "'.", apiId, subpath, startTime);
        }

        // 5. Request Body Size Enforcement
        long contentLength = exchange.getRequest().getHeaders().getContentLength();
        long maxBytes = config.maxRequestBodyBytes() != null ? config.maxRequestBodyBytes() : 1048576L;
        if (contentLength > maxBytes) {
            return writeBlockedResponse(exchange, HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE",
                    "Request content length (" + contentLength + " bytes) exceeds maximum permitted size of " + maxBytes + " bytes.", apiId, subpath, startTime);
        }

        // 6. Rate Limiting
        int rps = config.rateLimitRps() != null ? config.rateLimitRps() : 100;
        if (!rateLimiterService.tryAcquire(apiId, rps)) {
            return writeBlockedResponse(exchange, HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED",
                    "Rate limit exceeded for this API. Configured limit: " + rps + " req/sec.", apiId, subpath, startTime);
        }

        // 7. Dynamic URI Rewriting & Stripping Secret Headers
        String upstreamBase = config.upstreamBaseUrl().replaceAll("/+$", "");
        String targetUrl = upstreamBase + subpath;
        String query = exchange.getRequest().getURI().getRawQuery();
        if (query != null && !query.isBlank()) {
            targetUrl += "?" + query;
        }

        URI targetUri = URI.create(targetUrl);

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .uri(targetUri)
                .path(subpath)
                .headers(h -> h.remove("X-API-Key"))
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();

        mutatedExchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, targetUri);

        // Deduplicate CORS origin header if downstream also attaches one
        mutatedExchange.getResponse().beforeCommit(() -> {
            HttpHeaders headers = mutatedExchange.getResponse().getHeaders();
            java.util.List<String> origins = headers.get(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
            if (origins != null && origins.size() > 1) {
                headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origins.get(0));
            }
            return Mono.empty();
        });

        // Execute request and collect safe traffic telemetry upon completion
        return chain.filter(mutatedExchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - startTime;
            int statusCode = mutatedExchange.getResponse().getStatusCode() != null
                    ? mutatedExchange.getResponse().getStatusCode().value() : 0;
            long reqSize = mutatedRequest.getHeaders().getContentLength();
            long respSize = mutatedExchange.getResponse().getHeaders().getContentLength();

            Map<String, Object> telemetry = Map.of(
                    "apiId", apiId,
                    "httpMethod", method,
                    "path", subpath,
                    "clientIp", resolveClientIp(mutatedRequest),
                    "statusCode", statusCode,
                    "durationMs", duration,
                    "requestSize", reqSize >= 0 ? reqSize : 0L,
                    "responseSize", respSize >= 0 ? respSize : 0L,
                    "status", statusCode < 400 ? "SUCCESS" : "ERROR"
            );
            configClient.reportTraffic(telemetry);
        }));
    }

    private String resolveApiKey(ServerHttpRequest request) {
        String key = request.getHeaders().getFirst("X-API-Key");
        if (key != null && !key.isBlank()) {
            return key.trim();
        }
        String auth = request.getHeaders().getFirst("Authorization");
        if (auth != null && auth.toLowerCase().startsWith("bearer ")) {
            return auth.substring(7).trim();
        }
        return null;
    }

    private String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private Mono<Void> writeBlockedResponse(ServerWebExchange exchange, HttpStatus status, String errorCode,
                                           String message, String apiId, String subpath, long startTime) {
        if (apiId != null && !apiId.isBlank()) {
            long duration = startTime > 0 ? System.currentTimeMillis() - startTime : 0;
            long reqSize = exchange.getRequest().getHeaders().getContentLength();
            Map<String, Object> telemetry = Map.of(
                    "apiId", apiId,
                    "httpMethod", exchange.getRequest().getMethod().name(),
                    "path", subpath != null ? subpath : exchange.getRequest().getURI().getPath(),
                    "clientIp", resolveClientIp(exchange.getRequest()),
                    "statusCode", status.value(),
                    "durationMs", duration,
                    "requestSize", reqSize >= 0 ? reqSize : 0L,
                    "responseSize", 0L,
                    "status", status == HttpStatus.UNAUTHORIZED ? "UNAUTHORIZED" : "BLOCKED"
            );
            configClient.reportTraffic(telemetry);
        }
        return writeErrorResponse(exchange, status, errorCode, message);
    }

    private Mono<Void> writeErrorResponse(ServerWebExchange exchange, HttpStatus status, String errorCode, String message) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.empty();
        }
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> errorPayload = Map.of(
                "error", errorCode,
                "message", message,
                "path", exchange.getRequest().getURI().getPath(),
                "timestamp", Instant.now().toString()
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorPayload);
        } catch (JsonProcessingException e) {
            bytes = ("{\"error\":\"" + errorCode + "\",\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        response.getHeaders().setContentLength(bytes.length);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private Mono<Void> writeHealthResponse(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.empty();
        }
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> healthPayload = Map.of(
                "status", "UP",
                "service", "api-gateway",
                "timestamp", Instant.now().toString()
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(healthPayload);
        } catch (JsonProcessingException e) {
            bytes = "{\"status\":\"UP\",\"service\":\"api-gateway\"}".getBytes(StandardCharsets.UTF_8);
        }

        response.getHeaders().setContentLength(bytes.length);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private String resolveClientIp(ServerHttpRequest request) {
        String forwarded = request.getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        if (request.getRemoteAddress() != null && request.getRemoteAddress().getAddress() != null) {
            return request.getRemoteAddress().getAddress().getHostAddress();
        }
        return "127.0.0.1";
    }

    @Override
    public int getOrder() {
        return RouteToRequestUrlFilter.ROUTE_TO_URL_FILTER_ORDER + 1;
    }
}
