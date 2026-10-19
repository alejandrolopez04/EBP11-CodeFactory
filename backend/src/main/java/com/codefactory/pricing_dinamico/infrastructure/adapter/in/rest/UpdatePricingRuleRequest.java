package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UpdatePricingRuleRequest(
        VariableType variableType,
        VariableLevel level,
        TimeConditionType timeCondition,
        EffectType effectType,
        BigDecimal effectValue,
        List<Integer> productIds,
        LocalDateTime validFrom,
        LocalDateTime validTo
) {}