package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;

public record AppliedRuleStep(Integer ruleId, Integer priority, VariableType variableType,
                              String condition, EffectType effectType, BigDecimal effectValue,
                              BigDecimal priceBefore, BigDecimal priceAfter) {}
