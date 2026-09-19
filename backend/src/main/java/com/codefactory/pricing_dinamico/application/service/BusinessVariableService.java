package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ConfigureBusinessVariableUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetBusinessVariablesUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BusinessVariableService implements ConfigureBusinessVariableUseCase, GetBusinessVariablesUseCase {

    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;

    public BusinessVariableService(BusinessVariableRepositoryPort businessVariableRepositoryPort) {
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
    }

    @Override
    public BusinessVariable configureVariable(BusinessVariable variable) {
        validate(variable);
        Optional<BusinessVariable> existing = businessVariableRepositoryPort.findByType(variable.getVariableType());
        existing.ifPresent(current -> variable.setId(current.getId()));
        variable.setUpdatedAt(LocalDateTime.now());
        return businessVariableRepositoryPort.save(variable);
    }

    @Override
    public List<BusinessVariable> getAllVariables() {
        return businessVariableRepositoryPort.getAllVariables();
    }

    private void validate(BusinessVariable variable) {
        if (variable.getVariableType() == null) {
            throw new IllegalArgumentException("El tipo de variable de negocio es obligatorio.");
        }
        if (variable.getLevel() == null) {
            throw new IllegalArgumentException("El nivel de la variable es obligatorio.");
        }
        if (variable.getVariableType() == VariableType.TEMPORAL && variable.getTimeCondition() == null) {
            throw new IllegalArgumentException(
                "Para la variable TEMPORAL debe indicar la condicion de tiempo (HORA_PICO o TEMPORADA_ALTA).");
        }
    }
}
