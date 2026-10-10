package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public class PricingRule {
    /** Orden de aplicación: prioridad ascendente (1 se aplica primero); sin prioridad al final, desempata por id. */
    public static final Comparator<PricingRule> BY_PRIORITY = Comparator
            .comparing(PricingRule::getPriority, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
            .thenComparing(PricingRule::getId, Comparator.nullsLast(Comparator.<Integer>naturalOrder()));

    private Integer id;
    private VariableType variableType;
    private VariableLevel level;        // nullable, solo aplica si variableType es DEMAND o AVAILABILITY
    private TimeConditionType timeCondition;
    private EffectType effectType;
    private BigDecimal effectValue;
    private List<Integer> productIds;
    private RuleStatus ruleStatus;
    private Integer priority;           // orden de aplicación (1 = primero); null en reglas anteriores a la HU de prioridad

    public PricingRule() {}

    public PricingRule(Integer id, VariableType variableType, RuleStatus ruleStatus, VariableLevel level, EffectType effectType,
                       BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.ruleStatus = ruleStatus;
        this.effectType = effectType;
        this.level = level;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public PricingRule(Integer id, VariableType variableType, RuleStatus ruleStatus, TimeConditionType timeCondition,
                       EffectType effectType, BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.timeCondition = timeCondition;
        this.ruleStatus = ruleStatus;
        this.effectType = effectType;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public List<Integer> getProductIds() {
        return productIds;
    }

    public Integer getId() {return this.id;}

    public void setRuleStatus(RuleStatus ruleStatus) {
        this.ruleStatus = ruleStatus;
    }

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

    public Integer getPriority() {return priority;}

    public void setPriority(Integer priority) {this.priority = priority;}

    public Boolean isListEmpty() {return productIds.isEmpty();}
}
