package com.platform.controlplane.dto;

import com.platform.controlplane.model.Environment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
    @NotBlank(message = "Project name cannot be blank")
    @Size(min = 2, max = 120, message = "Project name must be between 2 and 120 characters")
    String name,

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    String description,

    Environment environment
) {}
