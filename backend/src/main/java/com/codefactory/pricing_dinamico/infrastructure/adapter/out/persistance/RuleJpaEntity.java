package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.*;
import jakarta.persistence.*;

import java.lang.Integer;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name="pricing_rules")
public class RuleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private java.lang.Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VariableType variableType;

    @Enumerated(EnumType.STRING)
    private VariableLevel level;

    @Enumerated(EnumType.STRING)
    private TimeConditionType timeCondition;

    @Enumerated(EnumType.STRING)
    private EffectType effectType;
    private BigDecimal effectValue;

    @ElementCollection
    @CollectionTable(name = "rule_product_ids", joinColumns = @JoinColumn(name = "rule_id"))
    @Column(name = "product_id")
    private List<java.lang.Integer> productIds;

    @Enumerated(EnumType.STRING)
    private RuleStatus ruleStatus;

    public RuleJpaEntity(java.lang.Integer id, VariableType variableType, RuleStatus ruleStatus , VariableLevel level, EffectType effectType, BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.ruleStatus = ruleStatus;
        this.effectType = effectType;
        this.level = level;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public RuleJpaEntity(java.lang.Integer id, VariableType variableType, RuleStatus ruleStatus, TimeConditionType timeCondition, EffectType effectType, BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.ruleStatus = ruleStatus;
        this.timeCondition = timeCondition;
        this.effectType = effectType;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public RuleJpaEntity() {

    }

    public List<java.lang.Integer> getProductIds() {
        return productIds;
    }

    public java.lang.Integer getId() {return this.id;}

    public RuleStatus getRuleStatus() {
        return ruleStatus;
    }

    public VariableType getVariableType() {
        return variableType;
    }

    public VariableLevel getLevel() {
        return level;
    }

    public TimeConditionType getTimeCondition() {
        return timeCondition;
    }

    public BigDecimal getEffectValue() {return effectValue;}

    public EffectType getEffectType() {return effectType;}
}
