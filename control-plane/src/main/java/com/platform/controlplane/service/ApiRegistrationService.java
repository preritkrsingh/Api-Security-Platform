package com.platform.controlplane.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import com.platform.controlplane.dto.ApiRegistrationDto;
import com.platform.controlplane.dto.ConnectivityTestResult;
import com.platform.controlplane.dto.CreateApiRegistrationRequest;
import com.platform.controlplane.dto.GatewayApiValidationDto;
import com.platform.controlplane.dto.UpdateApiRegistrationRequest;
import com.platform.controlplane.model.ApiRegistration;
import com.platform.controlplane.model.ConnectivityStatus;
import com.platform.controlplane.model.Environment;
import com.platform.controlplane.model.ProtectionStatus;
import com.platform.controlplane.repository.ApiKeyRepository;
import com.platform.controlplane.repository.ApiRegistrationRepository;
import com.platform.controlplane.repository.ProjectRepository;
import com.platform.controlplane.repository.TrafficRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApiRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(ApiRegistrationService.class);

    private final ApiRegistrationRepository apiRegistrationRepository;
    private final ProjectRepository projectRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final TrafficRecordRepository trafficRecordRepository;
    private final ApiKeyService apiKeyService;
    private final SsrfProtectionService ssrfProtectionService;
    private final HttpClient httpClient;

    public ApiRegistrationService(
            ApiRegistrationRepository apiRegistrationRepository,
            ProjectRepository projectRepository,
            ApiKeyRepository apiKeyRepository,
            TrafficRecordRepository trafficRecordRepository,
            ApiKeyService apiKeyService,
            SsrfProtectionService ssrfProtectionService) {
        this.apiRegistrationRepository = apiRegistrationRepository;
        this.projectRepository = projectRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.trafficRecordRepository = trafficRecordRepository;
        this.apiKeyService = apiKeyService;
        this.ssrfProtectionService = ssrfProtectionService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    @Transactional
    public ApiRegistrationDto create(String projectId, CreateApiRegistrationRequest request) {
        if (!projectRepository.existsById(projectId)) {
            throw new IllegalArgumentException("Project not found: " + projectId);
        }

        String apiName = request.name().trim();
        if (apiRegistrationRepository.existsByProjectIdAndName(projectId, apiName)) {
            throw new IllegalArgumentException("An API named '" + apiName + "' already exists in this project");
        }

        String upstreamUrl = request.upstreamBaseUrl().trim();
        ssrfProtectionService.validateUpstreamUrl(upstreamUrl);

        Environment env = request.environment() != null ? request.environment() : Environment.DEVELOPMENT;
        ApiRegistration api = new ApiRegistration(projectId, apiName, upstreamUrl, env);

        if (request.allowedMethods() != null && !request.allowedMethods().isEmpty()) {
            api.setAllowedMethodsSet(request.allowedMethods());
        }
        if (request.allowedPathPrefix() != null && !request.allowedPathPrefix().isBlank()) {
            api.setAllowedPathPrefix(request.allowedPathPrefix().trim());
        }
        if (request.connectTimeoutMs() != null) {
            api.setConnectTimeoutMs(request.connectTimeoutMs());
        }
        if (request.rateLimitRps() != null) {
            api.setRateLimitRps(request.rateLimitRps());
        }
        if (request.maxRequestBodyBytes() != null) {
            api.setMaxRequestBodyBytes(request.maxRequestBodyBytes());
        }

        api = apiRegistrationRepository.save(api);
        return toDto(api);
    }

    @Transactional(readOnly = true)
    public List<ApiRegistrationDto> findByProjectId(String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new IllegalArgumentException("Project not found: " + projectId);
        }
        return apiRegistrationRepository.findByProjectId(projectId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApiRegistrationDto> findAll() {
        return apiRegistrationRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiRegistrationDto findById(String id) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));
        return toDto(api);
    }

    @Transactional
    public ApiRegistrationDto update(String id, UpdateApiRegistrationRequest request) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            String newName = request.name().trim();
            if (!api.getName().equalsIgnoreCase(newName) &&
                apiRegistrationRepository.existsByProjectIdAndName(api.getProjectId(), newName)) {
                throw new IllegalArgumentException("An API named '" + newName + "' already exists in this project");
            }
            api.setName(newName);
        }

        if (request.upstreamBaseUrl() != null && !request.upstreamBaseUrl().isBlank()) {
            String newUrl = request.upstreamBaseUrl().trim();
            ssrfProtectionService.validateUpstreamUrl(newUrl);
            api.setUpstreamBaseUrl(newUrl);
            api.setConnectivityStatus(ConnectivityStatus.UNTESTED);
        }

        if (request.environment() != null) {
            api.setEnvironment(request.environment());
        }
        if (request.allowedMethods() != null && !request.allowedMethods().isEmpty()) {
            api.setAllowedMethodsSet(request.allowedMethods());
        }
        if (request.allowedPathPrefix() != null && !request.allowedPathPrefix().isBlank()) {
            api.setAllowedPathPrefix(request.allowedPathPrefix().trim());
        }
        if (request.connectTimeoutMs() != null) {
            api.setConnectTimeoutMs(request.connectTimeoutMs());
        }
        if (request.rateLimitRps() != null) {
            api.setRateLimitRps(request.rateLimitRps());
        }
        if (request.maxRequestBodyBytes() != null) {
            api.setMaxRequestBodyBytes(request.maxRequestBodyBytes());
        }

        api = apiRegistrationRepository.save(api);
        return toDto(api);
    }

    @Transactional
    public void delete(String id) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));
        apiKeyRepository.deleteByApiId(id);
        trafficRecordRepository.deleteByApiId(id);
        apiRegistrationRepository.delete(api);
    }

    @Transactional
    public ApiRegistrationDto activate(String id) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));
        api.setStatus(ProtectionStatus.ACTIVE);
        api = apiRegistrationRepository.save(api);
        return toDto(api);
    }

    @Transactional
    public ApiRegistrationDto deactivate(String id) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));
        api.setStatus(ProtectionStatus.INACTIVE);
        api = apiRegistrationRepository.save(api);
        return toDto(api);
    }

    @Transactional
    public ConnectivityTestResult testConnectivity(String id) {
        ApiRegistration api = apiRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + id));

        String url = api.getUpstreamBaseUrl();
        ssrfProtectionService.validateUpstreamUrl(url);

        long startTime = System.currentTimeMillis();
        ConnectivityStatus status;
        String message;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(api.getConnectTimeoutMs()))
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            long latency = System.currentTimeMillis() - startTime;
            status = ConnectivityStatus.CONNECTED;
            message = "Upstream responded with HTTP " + response.statusCode() + " (" + latency + "ms)";
            api.setConnectivityStatus(status);
            api.setLastConnectivityCheck(Instant.now());
            apiRegistrationRepository.save(api);
            return new ConnectivityTestResult(api.getId(), status, latency, api.getLastConnectivityCheck(), message);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            status = ConnectivityStatus.UNREACHABLE;
            message = "Connectivity check failed: " + e.getMessage();
            log.warn("[CONNECTIVITY_TEST_FAILED] API ID '{}' target '{}': {}", api.getId(), url, e.getMessage());
            api.setConnectivityStatus(status);
            api.setLastConnectivityCheck(Instant.now());
            apiRegistrationRepository.save(api);
            return new ConnectivityTestResult(api.getId(), status, latency, api.getLastConnectivityCheck(), message);
        }
    }

    @Transactional(readOnly = true)
    public GatewayApiValidationDto getGatewayValidation(String apiId) {
        ApiRegistration api = apiRegistrationRepository.findById(apiId)
                .orElseThrow(() -> new IllegalArgumentException("API registration not found: " + apiId));
        List<String> keyHashes = apiKeyService.getActiveKeyHashes(apiId);
        return new GatewayApiValidationDto(
                api.getId(),
                api.getUpstreamBaseUrl(),
                api.getStatus(),
                api.getAllowedMethodsSet(),
                api.getAllowedPathPrefix(),
                api.getConnectTimeoutMs(),
                api.getRateLimitRps(),
                api.getMaxRequestBodyBytes(),
                keyHashes
        );
    }

    private ApiRegistrationDto toDto(ApiRegistration a) {
        return new ApiRegistrationDto(
                a.getId(),
                a.getProjectId(),
                a.getName(),
                a.getUpstreamBaseUrl(),
                a.getEnvironment(),
                a.getAllowedMethodsSet(),
                a.getAllowedPathPrefix(),
                a.getConnectTimeoutMs(),
                a.getRateLimitRps(),
                a.getMaxRequestBodyBytes(),
                a.getStatus(),
                a.getConnectivityStatus(),
                a.getLastConnectivityCheck(),
                "/proxy/" + a.getId(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
