package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.ChangePricingRuleStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.in.UpdatePricingRuleUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing-rules-management")
public class PricingRuleManagementController {

    private final UpdatePricingRuleUseCase updatePricingRuleUseCase;
    private final ChangePricingRuleStatusUseCase changePricingRuleStatusUseCase;

    public PricingRuleManagementController(UpdatePricingRuleUseCase updatePricingRuleUseCase,
                                           ChangePricingRuleStatusUseCase changePricingRuleStatusUseCase) {
        this.updatePricingRuleUseCase = updatePricingRuleUseCase;
        this.changePricingRuleStatusUseCase = changePricingRuleStatusUseCase;
    }

    @PutMapping("/{id}")
    public ResponseEntity<PricingRule> updateRule(@PathVariable Long id,
                              @RequestBody UpdatePricingRuleRequest request) {

        PricingRule updatedRule = updatePricingRuleUseCase.updateRule(
                id,
            request.variableType(),
            request.level(),
            request.timeCondition(),
            request.effectType(),
            request.effectValue(),
            request.productIds(),
            request.validFrom(),
            request.validTo()
        );

        return ResponseEntity.ok(updatedRule);
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<PricingRule> activateRule(@PathVariable Long id) {
        return ResponseEntity.ok(changePricingRuleStatusUseCase.activateRule(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<PricingRule> deactivateRule(@PathVariable Long id) {
        return ResponseEntity.ok(changePricingRuleStatusUseCase.deactivateRule(id));
    }
}
