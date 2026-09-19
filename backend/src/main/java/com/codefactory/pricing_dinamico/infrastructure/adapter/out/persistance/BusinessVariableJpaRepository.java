package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BusinessVariableJpaRepository extends JpaRepository<BusinessVariableJpaEntity, Long> {
    Optional<BusinessVariableJpaEntity> findByVariableType(VariableType variableType);
}
