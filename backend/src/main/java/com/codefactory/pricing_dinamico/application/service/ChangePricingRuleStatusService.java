package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ChangePricingRuleStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import org.springframework.stereotype.Service;

@Service
public class ChangePricingRuleStatusService implements ChangePricingRuleStatusUseCase {

    private final RuleRepositoryPort ruleRepositoryPort;

    public ChangePricingRuleStatusService(RuleRepositoryPort ruleRepositoryPort) {
        this.ruleRepositoryPort = ruleRepositoryPort;
    }

    @Override
    public PricingRule activateRule(Long ruleId) {
        PricingRule rule = getRule(ruleId);
        rule.activate();
        return ruleRepositoryPort.save(rule);
    }

    @Override
    public PricingRule deactivateRule(Long ruleId) {
        PricingRule rule = getRule(ruleId);
        rule.deactivate();
        return ruleRepositoryPort.save(rule);
    }

    private PricingRule getRule(Long ruleId) {
        return ruleRepositoryPort.getRuleById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe una regla de pricing con id: " + ruleId));
    }
}
