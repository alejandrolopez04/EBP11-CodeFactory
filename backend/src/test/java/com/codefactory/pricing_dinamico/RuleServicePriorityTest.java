package com.codefactory.pricing_dinamico;

import com.codefactory.pricing_dinamico.application.port.in.RulePriority;
import com.codefactory.pricing_dinamico.application.service.RuleService;
import com.codefactory.pricing_dinamico.domain.model.entities.EffectType;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.support.InMemoryPorts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RuleServicePriorityTest {
    private InMemoryPorts.Rules rules;
    private InMemoryPorts.Products products;
    private RuleService service;

    @BeforeEach
    void setUp() {
        rules = new InMemoryPorts.Rules();
        products = new InMemoryPorts.Products();
        products.add(1, "Producto A", "100", "0", "1000");
        products.add(2, "Producto B", "100", "0", "1000");
        service = new RuleService(rules, products);
    }

    // Scenario: Priorización exitosa de reglas
    @Test
    void guardaElNuevoOrdenYLoDevuelveOrdenado() {
        PricingRule r1 = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1);
        PricingRule r2 = rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 2, 1);
        PricingRule r3 = rules.add(EffectType.VALOR, "5", RuleStatus.ACTIVE, 3, 1);

        List<PricingRule> result = service.prioritizeRules(1L, List.of(
                new RulePriority(r3.getId(), 1), new RulePriority(r1.getId(), 2), new RulePriority(r2.getId(), 3)));

        assertEquals(List.of(r3.getId(), r1.getId(), r2.getId()), result.stream().map(PricingRule::getId).toList());
        assertEquals(1, rules.getRuleById(r3.getId().longValue()).get().getPriority());
    }

    // Scenario: Reglas con la misma prioridad
    @Test
    void rechazaPrioridadRepetidaEnLaSolicitud() {
        PricingRule r1 = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1);
        PricingRule r2 = rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 2, 1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(r1.getId(), 1), new RulePriority(r2.getId(), 1))));

        assertTrue(ex.getMessage().contains("orden de prioridad único por producto"));
        assertEquals(1, rules.getRuleById(r1.getId().longValue()).get().getPriority()); // nada se guardó
        assertEquals(2, rules.getRuleById(r2.getId().longValue()).get().getPriority());
    }

    @Test
    void rechazaPrioridadQueChocaConUnaReglaNoEnviada() {
        PricingRule r1 = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1);
        rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 2, 1);

        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(r1.getId(), 2))));
    }

    @Test
    void rechazaChoqueEnOtroProductoDeLaMismaRegla() {
        PricingRule shared = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1, 2);
        rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 5, 2);

        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(shared.getId(), 5))));
    }

    @Test
    void rechazaReglaInactivaOAjenaAlProducto() {
        PricingRule inactive = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.INACTIVE, 1, 1);
        PricingRule otherProduct = rules.add(EffectType.VALOR, "50", RuleStatus.ACTIVE, 2, 2);

        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(inactive.getId(), 1))));
        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(otherProduct.getId(), 1))));
    }

    @Test
    void rechazaPrioridadInvalidaOProductoInexistente() {
        PricingRule r1 = rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 1, 1);

        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(1L, List.of(new RulePriority(r1.getId(), 0))));
        assertThrows(IllegalArgumentException.class, () ->
                service.prioritizeRules(99L, List.of(new RulePriority(r1.getId(), 1))));
        assertThrows(IllegalArgumentException.class, () -> service.prioritizeRules(1L, List.of()));
    }

    @Test
    void laReglaNuevaQuedaAlFinalDelOrden() {
        rules.add(EffectType.PORCENTAJE, "10", RuleStatus.ACTIVE, 4, 1);
        PricingRule created = service.createRule(
                new PricingRule(null, com.codefactory.pricing_dinamico.domain.model.entities.VariableType.DEMANDA,
                        RuleStatus.ACTIVE, com.codefactory.pricing_dinamico.domain.model.entities.VariableLevel.values()[0],
                        EffectType.VALOR, new java.math.BigDecimal("5"), List.of(1)));

        assertEquals(5, created.getPriority());
    }
}
