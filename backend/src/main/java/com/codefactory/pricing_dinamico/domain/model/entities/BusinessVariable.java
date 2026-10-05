package com.codefactory.pricing_dinamico.domain.model.entities;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.time.LocalDateTime;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "variableType",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = DemandVariable.class, name = "DEMANDA"),
        @JsonSubTypes.Type(value = AvailabilityVariable.class, name = "DISPONIBILIDAD"),
        @JsonSubTypes.Type(value = TemporalVariable.class, name = "TEMPORAL")
})

public abstract class BusinessVariable {
    private Long id;
    private VariableType variableType;
    private LocalDateTime updatedAt;

    public BusinessVariable() {}

    public BusinessVariable(Long id, VariableType variableType, LocalDateTime updatedAt) {
        this.id = id;
        this.variableType = variableType;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public VariableType getVariableType() { return variableType; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
