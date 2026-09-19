package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class BusinessVariableRepositoryAdapter implements BusinessVariableRepositoryPort {

    private final BusinessVariableJpaRepository businessVariableJpaRepository;

    public BusinessVariableRepositoryAdapter(BusinessVariableJpaRepository businessVariableJpaRepository) {
        this.businessVariableJpaRepository = businessVariableJpaRepository;
    }

    @Override
    public BusinessVariable save(BusinessVariable variable) {
        BusinessVariableJpaEntity entity = toEntity(variable);
        BusinessVariableJpaEntity saved = businessVariableJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<BusinessVariable> getAllVariables() {
        return businessVariableJpaRepository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<BusinessVariable> findByType(VariableType type) {
        return businessVariableJpaRepository.findByVariableType(type).map(this::toDomain);
    }

    private BusinessVariableJpaEntity toEntity(BusinessVariable variable) {
        return new BusinessVariableJpaEntity(variable.getId(), variable.getVariableType(), variable.getLevel(),
            variable.getTimeCondition(), variable.getUpdatedAt());
    }

    private BusinessVariable toDomain(BusinessVariableJpaEntity entity) {
        return new BusinessVariable(entity.getId(), entity.getVariableType(), entity.getLevel(),
            entity.getTimeCondition(), entity.getUpdatedAt());
    }
}
