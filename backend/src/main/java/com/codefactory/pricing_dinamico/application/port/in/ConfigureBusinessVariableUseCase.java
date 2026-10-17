package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;

import java.util.List;

public interface ConfigureBusinessVariableUseCase {
    List<BusinessVariable> configureVariables(List<BusinessVariable> variables);
}
