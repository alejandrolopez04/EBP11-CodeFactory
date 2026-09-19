package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;

public interface ConfigureBusinessVariableUseCase {
    BusinessVariable configureVariable(BusinessVariable variable);
}
