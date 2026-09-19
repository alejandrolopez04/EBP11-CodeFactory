package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessVariableRepositoryPort {
    BusinessVariable save(BusinessVariable variable);
    List<BusinessVariable> getAllVariables();
    Optional<BusinessVariable> findByType(VariableType type);
}
