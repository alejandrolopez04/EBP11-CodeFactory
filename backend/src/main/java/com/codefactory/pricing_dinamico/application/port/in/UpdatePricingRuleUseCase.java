package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface UpdatePricingRuleUseCase {
    PricingRule updateRule(Long ruleId,
                           VariableType variableType,
                           VariableLevel level,
                           TimeConditionType timeCondition,
                           EffectType effectType,
                           BigDecimal effectValue,
                           List<Integer> productIds,
                           LocalDateTime validFrom,
                           LocalDateTime validTo);
}
