package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;

public interface CreateRuleUseCase {
    PricingRule createRule(PricingRule pricingRule);
}
