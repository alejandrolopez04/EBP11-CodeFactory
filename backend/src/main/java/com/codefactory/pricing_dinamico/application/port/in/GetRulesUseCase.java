package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;

import java.util.List;

public interface GetRulesUseCase {
    /** Lista las reglas ordenadas por prioridad; si productId no es null, solo las de ese producto. */
    List<PricingRule> getRules(Long productId);
}
