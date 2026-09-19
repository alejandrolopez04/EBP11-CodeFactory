package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.CreateRuleUseCase;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import org.springframework.stereotype.Service;
import org.w3c.dom.stylesheets.LinkStyle;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RuleService implements CreateRuleUseCase {
    private final RuleRepositoryPort ruleRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;

    public RuleService(RuleRepositoryPort ruleRepositoryPort, ProductRepositoryPort productRepositoryPort) {
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
    }

    @Override
    public PricingRule createRule(PricingRule pricingRule) {
        if(pricingRule.isListEmpty()) {
            throw new IllegalArgumentException("Seleccione al menos un producto.");
        }

        validateEffectAgainstProductRange(pricingRule);
        pricingRule.setRuleStatus(RuleStatus.ACTIVE);
        return ruleRepositoryPort.save(pricingRule);
    }

    private void validateEffectAgainstProductRange(PricingRule pricingRule) {
        for (Integer productId : pricingRule.getProductIds()) {
            Product product = productRepositoryPort.getProductById(productId.longValue()).orElseThrow(()-> new IllegalArgumentException(
                    "El producto con id " + productId + " no existe."
            ));

            BigDecimal calculatedPrice = calculateEffectPrice(
                    product.getBasePrice(), pricingRule.getEffectType(), pricingRule.getEffectValue()
            );

            if (calculatedPrice.compareTo(product.getMinPrice()) < 0
                    || calculatedPrice.compareTo(product.getMaxPrice()) > 0) {
                throw new IllegalArgumentException(
                        "El efecto configurado generaría un precio de " + calculatedPrice.intValue() +
                                " para '" + product.getName() + "', fuera del rango permitido (" +
                                product.getMinPrice().intValue() + " - " + product.getMaxPrice().intValue() + ").");
            }
        }
    }

    private BigDecimal calculateEffectPrice(BigDecimal basePrice, EffectType effectType, BigDecimal effectValue) {
        if (effectType == EffectType.PORCENTAJE) {
            BigDecimal multiplier = BigDecimal.ONE.add(effectValue.divide(BigDecimal.valueOf(100)));
            return basePrice.multiply(multiplier);
        }
        return basePrice.add(effectValue);
    }

    ;
}
