package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ConfigureBusinessVariableUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetBusinessVariablesUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BusinessVariableService implements ConfigureBusinessVariableUseCase, GetBusinessVariablesUseCase {

    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;

    public BusinessVariableService(BusinessVariableRepositoryPort businessVariableRepositoryPort) {
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
    }

    @Override
    public BusinessVariable configureVariable(BusinessVariable variable) {
        variable.setUpdatedAt(LocalDateTime.now());
        return businessVariableRepositoryPort.save(variable);
    }

    @Override
    public List<BusinessVariable> getAllVariables() {
        return businessVariableRepositoryPort.getAllVariables();
    }
}
