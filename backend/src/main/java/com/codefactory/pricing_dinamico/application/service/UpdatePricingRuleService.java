package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.UpdatePricingRuleUseCase;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class UpdatePricingRuleService implements UpdatePricingRuleUseCase {

    private final RuleRepositoryPort ruleRepositoryPort;

    public UpdatePricingRuleService(RuleRepositoryPort ruleRepositoryPort) {
        this.ruleRepositoryPort = ruleRepositoryPort;
    }

    @Override
    public PricingRule updateRule(Long ruleId,
                                  VariableType variableType,
                                  VariableLevel level,
                                  TimeConditionType timeCondition,
                                  EffectType effectType,
                                  BigDecimal effectValue) {

        PricingRule rule = ruleRepositoryPort.getRuleById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe una regla de pricing con id: " + ruleId));

        rule.updateCondition(variableType, level, timeCondition);
        rule.updateEffect(effectType, effectValue);

        return ruleRepositoryPort.save(rule);
    }
}
