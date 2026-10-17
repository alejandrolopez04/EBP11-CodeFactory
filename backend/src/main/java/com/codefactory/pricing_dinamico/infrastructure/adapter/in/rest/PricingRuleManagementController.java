package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.ChangePricingRuleStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.in.UpdatePricingRuleUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

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
                                                  @RequestParam VariableType variableType,
                                                  @RequestParam(required = false) VariableLevel level,
                                                  @RequestParam(required = false) TimeConditionType timeCondition,
                                                  @RequestParam EffectType effectType,
                                                  @RequestParam BigDecimal effectValue) {

        PricingRule updatedRule = updatePricingRuleUseCase.updateRule(
                id,
                variableType,
                level,
                timeCondition,
                effectType,
                effectValue
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
