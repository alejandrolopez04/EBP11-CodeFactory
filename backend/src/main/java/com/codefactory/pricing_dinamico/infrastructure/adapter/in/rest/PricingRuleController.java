package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.CreateRuleUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetRulesUseCase;
import com.codefactory.pricing_dinamico.application.port.in.PrioritizeRulesUseCase;
import com.codefactory.pricing_dinamico.application.port.in.RulePriority;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/pricing_rules")
@CrossOrigin(origins = "http://localhost:8443")
public class PricingRuleController {
    private final CreateRuleUseCase createRuleUseCase;
    private final GetRulesUseCase getRulesUseCase;
    private final PrioritizeRulesUseCase prioritizeRulesUseCase;

    PricingRuleController(CreateRuleUseCase createRuleUseCase,
                          GetRulesUseCase getRulesUseCase,
                          PrioritizeRulesUseCase prioritizeRulesUseCase) {
        this.createRuleUseCase = createRuleUseCase;
        this.getRulesUseCase = getRulesUseCase;
        this.prioritizeRulesUseCase = prioritizeRulesUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PricingRule createPricingRule(@RequestBody PricingRule pricingRule) {return createRuleUseCase.createRule(pricingRule);}

    /** Reglas ordenadas por prioridad. Con ?productId=N solo las de ese producto. */
    @GetMapping
    public List<PricingRule> getPricingRules(@RequestParam(required = false) Long productId) {
        return getRulesUseCase.getRules(productId);
    }

    /** Define el orden de prioridad de las reglas de un producto. */
    @PutMapping("/priorities")
    public List<PricingRule> prioritizeRules(@RequestBody PrioritizeRulesRequest request) {
        return prioritizeRulesUseCase.prioritizeRules(request.productId(), request.priorities());
    }

    public record PrioritizeRulesRequest(Long productId, List<RulePriority> priorities) {}
}
