package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;

import java.util.List;

public interface VariableUpdateHistoryRepositoryPort {

    VariableUpdateHistory save(VariableUpdateHistory history);

    List<VariableUpdateHistory> findByVariableTypeOrderByExecutedAtDesc(String variableType);
}
