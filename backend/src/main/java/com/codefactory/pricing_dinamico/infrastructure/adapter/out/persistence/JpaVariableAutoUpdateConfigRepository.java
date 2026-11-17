package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.application.port.out.VariableAutoUpdateConfigRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaVariableAutoUpdateConfigRepository
        implements VariableAutoUpdateConfigRepositoryPort {

    private final SpringDataVariableAutoUpdateConfigRepository springDataRepository;

    public JpaVariableAutoUpdateConfigRepository(
            SpringDataVariableAutoUpdateConfigRepository springDataRepository
    ) {
        this.springDataRepository = springDataRepository;
    }

    @Override
    public VariableAutoUpdateConfig save(VariableAutoUpdateConfig configuration) {
        return springDataRepository.save(configuration);
    }

    @Override
    public List<VariableAutoUpdateConfig> findAll() {
        return springDataRepository.findAll();
    }

    @Override
    public List<VariableAutoUpdateConfig> findActive() {
        return springDataRepository.findByActiveTrue();
    }

    @Override
    public Optional<VariableAutoUpdateConfig> findByVariableType(String variableType) {
        return springDataRepository.findByVariableType(variableType);
    }
}
