package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.UpdatePricingRuleUseCase;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import com.codefactory.pricing_dinamico.domain.model.events.PricingInputsChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class UpdatePricingRuleService implements UpdatePricingRuleUseCase {

    private final RuleRepositoryPort ruleRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;
    private final ApplicationEventPublisher events;

    public UpdatePricingRuleService(RuleRepositoryPort ruleRepositoryPort,
                                    ProductRepositoryPort productRepositoryPort,
                                    ApplicationEventPublisher events) {
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
        this.events = events;
    }

    @Override
    public PricingRule updateRule(Long ruleId,
                                  VariableType variableType,
                                  VariableLevel level,
                                  TimeConditionType timeCondition,
                                  EffectType effectType,
                                  BigDecimal effectValue,
                                  List<Integer> productIds,
                                  LocalDateTime validFrom,
                                  LocalDateTime validTo) {

        PricingRule rule = ruleRepositoryPort.getRuleById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe una regla de pricing con id: " + ruleId));

        Set<Integer> affectedProducts = new LinkedHashSet<>();
        if (rule.getProductIds() != null) {
            affectedProducts.addAll(rule.getProductIds());
        }

        rule.updateCondition(variableType, level, timeCondition);
        rule.updateEffect(effectType, effectValue);
        rule.updateProducts(productIds);
        rule.updateValidity(validFrom, validTo);
        validateProductsAndPriceRange(rule);

        PricingRule saved = ruleRepositoryPort.save(rule);
        affectedProducts.addAll(saved.getProductIds());
        events.publishEvent(PricingInputsChangedEvent.forProducts(affectedProducts,
                "Regla " + saved.getId() + " actualizada"));
        return saved;
    }

    private void validateProductsAndPriceRange(PricingRule rule) {
        for (Integer productId : rule.getProductIds()) {
            Product product = productRepositoryPort.getProductById(productId.longValue()).orElseThrow(() ->
                    new IllegalArgumentException("El producto con id " + productId + " no existe."));

            BigDecimal calculatedPrice = calculateEffectPrice(
                    product.getBasePrice(), rule.getEffectType(), rule.getEffectValue());
            if (calculatedPrice.compareTo(product.getMinPrice()) < 0
                    || calculatedPrice.compareTo(product.getMaxPrice()) > 0) {
                throw new IllegalArgumentException(
                        "El efecto configurado generaría un precio de " + calculatedPrice.intValue()
                                + " para '" + product.getName() + "', fuera del rango permitido ("
                                + product.getMinPrice().intValue() + " - " + product.getMaxPrice().intValue() + ").");
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
}
