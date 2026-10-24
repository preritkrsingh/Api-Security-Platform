package com.platform.controlplane.repository;

import java.util.Optional;

import com.platform.controlplane.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {
    Optional<Project> findByName(String name);
    boolean existsByName(String name);
}
