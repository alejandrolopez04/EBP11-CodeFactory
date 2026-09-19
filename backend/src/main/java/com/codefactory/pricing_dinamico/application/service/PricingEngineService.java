package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.CalculateFinalPriceUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PricingEngineService implements CalculateFinalPriceUseCase {

    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;
    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;

    public PricingEngineService(ProductRepositoryPort productRepositoryPort,
                                 RuleRepositoryPort ruleRepositoryPort,
                                 BusinessVariableRepositoryPort businessVariableRepositoryPort) {
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
    }

    @Override
    public PriceCalculationResult calculateFinalPrice(Long productId) {
        Product product = productRepositoryPort.getProductById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con id: " + productId));

        Map<VariableType, BusinessVariable> currentVariables = businessVariableRepositoryPort.getAllVariables()
            .stream()
            .collect(Collectors.toMap(BusinessVariable::getVariableType, v -> v));

        List<PricingRule> applicableRules = ruleRepositoryPort.getRules().stream()
            .filter(rule -> rule.getRuleStatus() == RuleStatus.ACTIVE)
            .filter(rule -> rule.getProductIds() != null && rule.getProductIds().contains(product.getId().intValue()))
            .filter(rule -> matchesCurrentVariable(rule, currentVariables))
            .sorted((r1, r2) -> Integer.compare(r1.getId(), r2.getId()))
            .collect(Collectors.toList());

        BigDecimal price = product.getBasePrice();
        List<Integer> appliedRuleIds = new ArrayList<>();

        for (PricingRule rule : applicableRules) {
            price = applyEffect(price, rule.getEffectType(), rule.getEffectValue());
            appliedRuleIds.add(rule.getId());
        }

        boolean clampedToMax = false;
        boolean clampedToMin = false;

        if (price.compareTo(product.getMaxPrice()) > 0) {
            price = product.getMaxPrice();
            clampedToMax = true;
        } else if (price.compareTo(product.getMinPrice()) < 0) {
            price = product.getMinPrice();
            clampedToMin = true;
        }

        return new PriceCalculationResult(product.getId(), product.getBasePrice(), price,
            clampedToMax, clampedToMin, appliedRuleIds, LocalDateTime.now());
    }

    private boolean matchesCurrentVariable(PricingRule rule, Map<VariableType, BusinessVariable> currentVariables) {
        BusinessVariable variable = currentVariables.get(rule.getVariableType());
        if (variable == null) return false;
        if (variable.getLevel() != rule.getLevel()) return false;
        if (rule.getVariableType() == VariableType.TEMPORAL) {
            return rule.getTimeCondition() != null && rule.getTimeCondition() == variable.getTimeCondition();
        }
        return true;
    }

    private BigDecimal applyEffect(BigDecimal price, EffectType effectType, BigDecimal effectValue) {
        if (effectType == EffectType.PORCENTAJE) {
            BigDecimal factor = BigDecimal.ONE.add(effectValue.divide(BigDecimal.valueOf(100)));
            return price.multiply(factor);
        }
        return price.add(effectValue);
    }
}
