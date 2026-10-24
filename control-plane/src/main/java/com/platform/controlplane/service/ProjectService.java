package com.platform.controlplane.service;

import java.util.List;

import com.platform.controlplane.dto.CreateProjectRequest;
import com.platform.controlplane.dto.ProjectDto;
import com.platform.controlplane.dto.UpdateProjectRequest;
import com.platform.controlplane.model.ApiRegistration;
import com.platform.controlplane.model.Environment;
import com.platform.controlplane.model.Project;
import com.platform.controlplane.repository.ApiKeyRepository;
import com.platform.controlplane.repository.ApiRegistrationRepository;
import com.platform.controlplane.repository.ProjectRepository;
import com.platform.controlplane.repository.SecurityEventRepository;
import com.platform.controlplane.repository.TrafficRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ApiRegistrationRepository apiRegistrationRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final TrafficRecordRepository trafficRecordRepository;
    private final SecurityEventRepository securityEventRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            ApiRegistrationRepository apiRegistrationRepository,
            ApiKeyRepository apiKeyRepository,
            TrafficRecordRepository trafficRecordRepository,
            SecurityEventRepository securityEventRepository) {
        this.projectRepository = projectRepository;
        this.apiRegistrationRepository = apiRegistrationRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.trafficRecordRepository = trafficRecordRepository;
        this.securityEventRepository = securityEventRepository;
    }

    @Transactional
    public ProjectDto create(CreateProjectRequest request) {
        if (projectRepository.existsByName(request.name().trim())) {
            throw new IllegalArgumentException("A project with name '" + request.name().trim() + "' already exists");
        }

        Environment env = request.environment() != null ? request.environment() : Environment.DEVELOPMENT;
        Project project = new Project(request.name().trim(), request.description(), env);
        project = projectRepository.save(project);
        return toDto(project, 0);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> findAll() {
        return projectRepository.findAll().stream()
            .map(p -> {
                long count = apiRegistrationRepository.findByProjectId(p.getId()).size();
                return toDto(p, count);
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDto findById(String id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
        long count = apiRegistrationRepository.findByProjectId(project.getId()).size();
        return toDto(project, count);
    }

    @Transactional
    public ProjectDto update(String id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        String newName = request.name().trim();
        if (!project.getName().equalsIgnoreCase(newName) && projectRepository.existsByName(newName)) {
            throw new IllegalArgumentException("A project with name '" + newName + "' already exists");
        }

        project.setName(newName);
        if (request.description() != null) {
            project.setDescription(request.description());
        }
        if (request.environment() != null) {
            project.setEnvironment(request.environment());
        }

        project = projectRepository.save(project);
        long count = apiRegistrationRepository.findByProjectId(project.getId()).size();
        return toDto(project, count);
    }

    @Transactional
    public void delete(String id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        // Cascade cleanup child APIs, keys, traffic records, and security events
        List<ApiRegistration> apis = apiRegistrationRepository.findByProjectId(id);
        for (ApiRegistration api : apis) {
            apiKeyRepository.deleteByApiId(api.getId());
            trafficRecordRepository.deleteByApiId(api.getId());
        }
        trafficRecordRepository.deleteByProjectId(id);
        securityEventRepository.deleteByProjectId(id);
        apiRegistrationRepository.deleteByProjectId(id);
        projectRepository.delete(project);
    }

    private ProjectDto toDto(Project p, long apiCount) {
        return new ProjectDto(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getEnvironment(),
            apiCount,
            p.getCreatedAt(),
            p.getUpdatedAt()
        );
    }
}
