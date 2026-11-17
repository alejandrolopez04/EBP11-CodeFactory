package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataVariableAutoUpdateConfigRepository
        extends JpaRepository<VariableAutoUpdateConfig, Long> {

    List<VariableAutoUpdateConfig> findByActiveTrue();

    Optional<VariableAutoUpdateConfig> findByVariableType(String variableType);
}
