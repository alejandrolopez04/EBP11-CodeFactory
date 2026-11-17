package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;

import java.util.List;
import java.util.Optional;

public interface VariableAutoUpdateConfigRepositoryPort {

    VariableAutoUpdateConfig save(VariableAutoUpdateConfig configuration);

    List<VariableAutoUpdateConfig> findAll();

    List<VariableAutoUpdateConfig> findActive();

    Optional<VariableAutoUpdateConfig> findByVariableType(String variableType);
}
