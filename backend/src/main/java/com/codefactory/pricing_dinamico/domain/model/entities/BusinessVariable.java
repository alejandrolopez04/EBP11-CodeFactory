package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.LocalDateTime;

public class BusinessVariable {
    private Long id;
    private VariableType variableType;
    private VariableLevel level;
    private TimeConditionType timeCondition;
    private LocalDateTime updatedAt;

    public BusinessVariable() {}

    public BusinessVariable(Long id, VariableType variableType, VariableLevel level,
                             TimeConditionType timeCondition, LocalDateTime updatedAt) {
        this.id = id;
        this.variableType = variableType;
        this.level = level;
        this.timeCondition = timeCondition;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public VariableType getVariableType() { return variableType; }
    public void setVariableType(VariableType variableType) { this.variableType = variableType; }
    public VariableLevel getLevel() { return level; }
    public void setLevel(VariableLevel level) { this.level = level; }
    public TimeConditionType getTimeCondition() { return timeCondition; }
    public void setTimeCondition(TimeConditionType timeCondition) { this.timeCondition = timeCondition; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
