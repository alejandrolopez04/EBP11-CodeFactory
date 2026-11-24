package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;

import java.util.List;

public interface ManageVariableAutoUpdateUseCase {

    List<VariableAutoUpdateConfig> getConfigurations();

    VariableAutoUpdateConfig saveConfiguration(VariableAutoUpdateConfig configuration);

    VariableUpdateHistory runUpdate(String variableType);

    List<VariableUpdateHistory> getHistory(String variableType);
}
