package com.codefactory.pricing_dinamico.domain.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "variable_update_history")
public class VariableUpdateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_type", nullable = false)
    private String variableType;

    @Column(name = "source_name")
    private String sourceName;

    @Column(name = "previous_value")
    private Long previousValue;

    @Column(name = "new_value")
    private Long newValue;

    @Column(name = "result", nullable = false)
    private String result;

    @Column(name = "message")
    private String message;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVariableType() { return variableType; }
    public void setVariableType(String variableType) { this.variableType = variableType; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public Long getPreviousValue() { return previousValue; }
    public void setPreviousValue(Long previousValue) { this.previousValue = previousValue; }

    public Long getNewValue() { return newValue; }
    public void setNewValue(Long newValue) { this.newValue = newValue; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getExecutedAt() { return executedAt; }
    public void setExecutedAt(LocalDateTime executedAt) { this.executedAt = executedAt; }
}
