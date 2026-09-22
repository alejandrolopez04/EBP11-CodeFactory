package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.util.List;

public class PricingRule {
    private Integer id;
    private VariableType variableType;
    private VariableLevel level;        // nullable, solo aplica si variableType es DEMAND o AVAILABILITY
    private TimeConditionType timeCondition;
    private EffectType effectType;
    private BigDecimal effectValue;
    private List<Integer> productIds;
    private RuleStatus ruleStatus;

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

    public Boolean isListEmpty() {return productIds.isEmpty();}
}
