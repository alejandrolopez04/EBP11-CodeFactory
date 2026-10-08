package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;

import java.util.List;

public interface PrioritizeRulesUseCase {
    /** Define el orden de prioridad de las reglas de un producto y devuelve las reglas del producto ya ordenadas. */
    List<PricingRule> prioritizeRules(Long productId, List<RulePriority> priorities);
}
