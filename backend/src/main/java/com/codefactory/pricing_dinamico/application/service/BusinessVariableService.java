package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ConfigureBusinessVariableUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetBusinessVariablesUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;
import com.codefactory.pricing_dinamico.domain.model.events.PricingInputsChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusinessVariableService implements ConfigureBusinessVariableUseCase, GetBusinessVariablesUseCase {

    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;
    private final ApplicationEventPublisher events;

    public BusinessVariableService(BusinessVariableRepositoryPort businessVariableRepositoryPort,
                                   ApplicationEventPublisher events) {
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
        this.events = events;
    }

    @Override
    @Transactional
    public List<BusinessVariable> configureVariables(List<BusinessVariable> variables) {
        LocalDateTime now = LocalDateTime.now();
        List<BusinessVariable> saved = variables.stream()
                .peek(v -> v.setUpdatedAt(now))
                .map(businessVariableRepositoryPort::save)
                .toList();

        String changed = saved.stream().map(v -> v.getVariableType().name())
                .collect(Collectors.joining(", "));
        events.publishEvent(PricingInputsChangedEvent.all(TriggerType.VARIABLES,
                "Variables de negocio actualizadas (" + changed + ")"));
        return saved;
    }

    @Override
    public List<BusinessVariable> getAllVariables() {
        return businessVariableRepositoryPort.getAllVariables();
    }
}