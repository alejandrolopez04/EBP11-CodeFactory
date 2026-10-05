package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class BusinessVariableRepositoryAdapter implements BusinessVariableRepositoryPort {

    private final BusinessVariableJpaRepository businessVariableJpaRepository;
    private final ObjectMapper objectMapper;

    public BusinessVariableRepositoryAdapter(BusinessVariableJpaRepository businessVariableJpaRepository, ObjectMapper objectMapper) {
        this.businessVariableJpaRepository = businessVariableJpaRepository;
        this.objectMapper = objectMapper;
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

    public BusinessVariableJpaEntity toEntity(BusinessVariable domain) {
        ObjectNode payload = objectMapper.valueToTree(domain);
        payload.remove("id");
        payload.remove("updatedAt");
        payload.remove("variableType");
        return new BusinessVariableJpaEntity(
                domain.getId(),
                domain.getVariableType(),
                objectMapper.writeValueAsString(payload),
                domain.getUpdatedAt());
    }

    public BusinessVariable toDomain(BusinessVariableJpaEntity entity) {
        Class<? extends BusinessVariable> clazz = switch (entity.getVariableType()) {
            case DEMANDA -> DemandVariable.class;
            case DISPONIBILIDAD -> AvailabilityVariable.class;
            case TEMPORAL -> TemporalVariable.class;
        };
        ObjectNode payload = (ObjectNode) objectMapper.readTree(entity.getPayload());
        payload.put("variableType", entity.getVariableType().name());
        BusinessVariable variable = objectMapper.treeToValue(payload, clazz);
        variable.setId(entity.getId());
        variable.setUpdatedAt(entity.getUpdatedAt());
        return variable;
    }
}
