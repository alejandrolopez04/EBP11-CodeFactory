package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "business_variables")
public class BusinessVariableJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private VariableType variableType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VariableLevel level;

    @Enumerated(EnumType.STRING)
    private TimeConditionType timeCondition;

    private LocalDateTime updatedAt;

    public BusinessVariableJpaEntity() {}

    public BusinessVariableJpaEntity(Long id, VariableType variableType, VariableLevel level,
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
