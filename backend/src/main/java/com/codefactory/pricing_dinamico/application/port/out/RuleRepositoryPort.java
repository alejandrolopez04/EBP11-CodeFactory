package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RuleRepositoryPort {
    PricingRule save(PricingRule pricingRule);

    List<PricingRule> getRules();

    Optional<PricingRule> getRuleById(Long id);

    boolean existsById(Long id);

    void deactivateRule(Long id);

    void activateRule(Long id);
}
