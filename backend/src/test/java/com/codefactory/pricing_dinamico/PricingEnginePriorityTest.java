package com.codefactory.pricing_dinamico;

import com.codefactory.pricing_dinamico.application.port.in.RulePriority;
import com.codefactory.pricing_dinamico.application.service.PricingEngineService;
import com.codefactory.pricing_dinamico.application.service.RuleService;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.support.InMemoryPorts;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PricingEnginePriorityTest {

    // Scenario: Priorización exitosa — el motor aplica las reglas en el orden definido
    @Test
    void elNuevoOrdenSeAplicaEnElSiguienteCalculo() {
        InMemoryPorts.Rules rules = new InMemoryPorts.Rules();
        InMemoryPorts.Products products = new InMemoryPorts.Products();
        products.add(1, "Producto A", "100", "0", "1000");
        PricingEngineService engine = new PricingEngineService(products, rules, new InMemoryPorts.Variables());
        RuleService ruleService = new RuleService(rules, products);

        PricingRule percent = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1); // +10 %
        PricingRule fixed = rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 2, 1);        // +50

        // % primero: 100 * 1.10 = 110 -> + 50 = 160
        PriceCalculationResult before = engine.calculateFinalPrice(1L);
        assertEquals(0, new BigDecimal("160").compareTo(before.getFinalPrice()));
        assertEquals(List.of(percent.getId(), fixed.getId()), before.getAppliedRuleIds());

        ruleService.prioritizeRules(1L, List.of(
                new RulePriority(fixed.getId(), 1), new RulePriority(percent.getId(), 2)));

        // valor primero: 100 + 50 = 150 -> * 1.10 = 165
        PriceCalculationResult after = engine.calculateFinalPrice(1L);
        assertEquals(0, new BigDecimal("165").compareTo(after.getFinalPrice()));
        assertEquals(List.of(fixed.getId(), percent.getId()), after.getAppliedRuleIds());
    }

    @Test
    void reglasSinPrioridadSeAplicanAlFinalPorId() {
        InMemoryPorts.Rules rules = new InMemoryPorts.Rules();
        InMemoryPorts.Products products = new InMemoryPorts.Products();
        products.add(1, "Producto A", "100", "0", "1000");
        PricingEngineService engine = new PricingEngineService(products, rules, new InMemoryPorts.Variables());

        PricingRule legacy1 = rules.add(EffectType.VALOR, "10", RuleStatus.ACTIVE, null, 1);
        PricingRule prioritized = rules.add(EffectType.VALOR, "20", RuleStatus.ACTIVE, 1, 1);
        PricingRule legacy2 = rules.add(EffectType.VALOR, "30", RuleStatus.ACTIVE, null, 1);

        assertEquals(List.of(prioritized.getId(), legacy1.getId(), legacy2.getId()),
                engine.calculateFinalPrice(1L).getAppliedRuleIds());
    }
}
