package com.codefactory.pricing_dinamico.domain.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "variable_auto_update_config")
public class VariableAutoUpdateConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_type", nullable = false)
    private String variableType;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    @Column(name = "source_url", nullable = false)
    private String sourceUrl;

    @Column(name = "value_field", nullable = false)
    private String valueField;

    @Column(name = "frequency_minutes", nullable = false)
    private Long frequencyMinutes;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVariableType() { return variableType; }
    public void setVariableType(String variableType) { this.variableType = variableType; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getValueField() { return valueField; }
    public void setValueField(String valueField) { this.valueField = valueField; }

    public Long getFrequencyMinutes() { return frequencyMinutes; }
    public void setFrequencyMinutes(Long frequencyMinutes) { this.frequencyMinutes = frequencyMinutes; }

    public LocalDateTime getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(LocalDateTime lastRunAt) { this.lastRunAt = lastRunAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
