package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** HU13: calcula el precio que tendrían unos productos con una regla, sin guardar nada. */
public interface SimulatePriceUseCase {
    /** Condición y efecto de una regla que todavía no existe (o de una existente con cambios). */
    record RuleDraft(VariableType variableType, VariableLevel level, TimeConditionType timeCondition,
                     EffectType effectType, BigDecimal effectValue) {}

    /**
     * ruleId solo: regla existente tal cual. rule solo: regla nueva.
     * Ambos: regla existente con la condición y el efecto de rule.
     */
    record SimulationRequest(Integer ruleId, RuleDraft rule, List<Long> productIds) {}

    record ProductSimulation(Long productId, String productName, String sku, boolean productActive,
                             BigDecimal currentPrice, BigDecimal basePrice, BigDecimal minPrice, BigDecimal maxPrice,
                             BigDecimal simulatedPrice, BigDecimal calculatedPrice,
                             boolean clampedToMax, boolean clampedToMin, boolean ruleApplied,
                             List<Integer> appliedRuleIds) {}

    /** simulation siempre es true: el cliente lo usa para marcar el resultado como hipotético. */
    record SimulationResult(boolean simulation, Integer ruleId, LocalDateTime simulatedAt, long elapsedMs,
                            List<ProductSimulation> products) {}

    SimulationResult simulate(SimulationRequest request);
}
