package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.CreateRuleUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetRulesUseCase;
import com.codefactory.pricing_dinamico.application.port.in.PrioritizeRulesUseCase;
import com.codefactory.pricing_dinamico.application.port.in.RulePriority;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

@Service
public class RuleService implements CreateRuleUseCase, GetRulesUseCase, PrioritizeRulesUseCase {
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
        pricingRule.setPriority(nextPriority());
        return ruleRepositoryPort.save(pricingRule);
    }

    @Override
    public List<PricingRule> getRules(Long productId) {
        return ruleRepositoryPort.getRules().stream()
                .filter(rule -> productId == null || containsProduct(rule, productId))
                .sorted(PricingRule.BY_PRIORITY)
                .toList();
    }

    @Override
    @Transactional
    public List<PricingRule> prioritizeRules(Long productId, List<RulePriority> priorities) {
        if (productId == null) {
            throw new IllegalArgumentException("Seleccione un producto.");
        }
        Product product = productRepositoryPort.getProductById(productId).orElseThrow(() ->
                new IllegalArgumentException("El producto con id " + productId + " no existe."));
        if (priorities == null || priorities.isEmpty()) {
            throw new IllegalArgumentException("Envíe al menos una regla con su orden de prioridad.");
        }

        // 1. Formato de la solicitud: ids y prioridades válidos, sin reglas repetidas
        Map<Integer, Integer> requested = new LinkedHashMap<>();
        for (RulePriority item : priorities) {
            if (item == null || item.ruleId() == null || item.priority() == null || item.priority() < 1) {
                throw new IllegalArgumentException("Cada regla debe tener un orden de prioridad numérico mayor o igual a 1.");
            }
            if (requested.put(item.ruleId(), item.priority()) != null) {
                throw new IllegalArgumentException("La regla " + item.ruleId() + " aparece más de una vez en la solicitud.");
            }
        }

        // 2. Las reglas deben existir, estar activas y pertenecer al producto
        List<PricingRule> allRules = ruleRepositoryPort.getRules();
        Map<Integer, PricingRule> rulesById = new HashMap<>();
        allRules.forEach(rule -> rulesById.put(rule.getId(), rule));

        Set<Integer> affectedProducts = new TreeSet<>();
        for (Integer ruleId : requested.keySet()) {
            PricingRule rule = rulesById.get(ruleId);
            if (rule == null) {
                throw new IllegalArgumentException("La regla con id " + ruleId + " no existe.");
            }
            if (!containsProduct(rule, productId)) {
                throw new IllegalArgumentException("La regla " + ruleId + " no está asociada al producto '" + product.getName() + "'.");
            }
            if (rule.getRuleStatus() != RuleStatus.ACTIVE) {
                throw new IllegalArgumentException("La regla " + ruleId + " está inactiva; solo se priorizan reglas activas.");
            }
            affectedProducts.addAll(rule.getProductIds());
        }

        // 3. Prioridad única por producto: se valida el resultado final para cada producto afectado
        //    (una regla puede estar en varios productos y comparte su prioridad en todos ellos)
        for (Integer affectedProductId : affectedProducts) {
            Map<Integer, Integer> ruleByPriority = new HashMap<>();
            for (PricingRule rule : allRules) {
                if (rule.getRuleStatus() != RuleStatus.ACTIVE || !containsProduct(rule, affectedProductId.longValue())) {
                    continue;
                }
                Integer effective = requested.getOrDefault(rule.getId(), rule.getPriority());
                if (effective != null && ruleByPriority.put(effective, rule.getId()) != null) {
                    throw new IllegalArgumentException("Hay reglas del producto '" + productName(affectedProductId)
                            + "' con el mismo nivel de prioridad (" + effective
                            + "). Asigne un orden de prioridad único por producto.");
                }
            }
        }

        // 4. Se guarda; el motor de precios lee este orden en el siguiente cálculo
        List<PricingRule> toSave = requested.keySet().stream().map(rulesById::get).toList();
        toSave.forEach(rule -> rule.setPriority(requested.get(rule.getId())));
        ruleRepositoryPort.saveAll(toSave);

        return getRules(productId);
    }

    private boolean containsProduct(PricingRule rule, Long productId) {
        return rule.getProductIds() != null && rule.getProductIds().contains(productId.intValue());
    }

    private String productName(Integer productId) {
        return productRepositoryPort.getProductById(productId.longValue())
                .map(Product::getName)
                .orElse(String.valueOf(productId));
    }

    /** Las reglas nuevas quedan al final del orden de aplicación. */
    private int nextPriority() {
        return ruleRepositoryPort.getRules().stream()
                .map(PricingRule::getPriority)
                .filter(Objects::nonNull)
                .max(Integer::compare)
                .orElse(0) + 1;
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
}
