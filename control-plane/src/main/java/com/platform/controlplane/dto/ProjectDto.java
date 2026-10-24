package com.platform.controlplane.dto;

import java.time.Instant;
import com.platform.controlplane.model.Environment;

public record ProjectDto(
    String id,
    String name,
    String description,
    Environment environment,
    long apiCount,
    Instant createdAt,
    Instant updatedAt
) {}
