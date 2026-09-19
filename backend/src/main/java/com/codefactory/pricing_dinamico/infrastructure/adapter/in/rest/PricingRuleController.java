package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.CreateRuleUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/pricing_rules")
@CrossOrigin(origins = "http://localhost:8443")
public class PricingRuleController {
    private final CreateRuleUseCase createRuleUseCase;

    PricingRuleController(CreateRuleUseCase createRuleUseCase) {this.createRuleUseCase = createRuleUseCase;}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PricingRule createPricingRule(@RequestBody PricingRule pricingRule) {return createRuleUseCase.createRule(pricingRule);}
}
