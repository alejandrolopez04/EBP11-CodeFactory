package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductNotFoundException;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * HU13: simulación de una regla. Usa el cálculo puro del motor (PricingEngineService.calculateWith),
 * que no actualiza el precio del producto ni crea trazas, así que nada de esto queda en el historial.
 */
@Service
public class PriceSimulationService implements SimulatePriceUseCase {
    /** Id provisional de una regla nueva, para reconocerla entre las reglas aplicadas. */
    private static final int NEW_RULE_ID = -1;

    private final PricingEngineService pricingEngineService;
    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;

    public PriceSimulationService(PricingEngineService pricingEngineService,
                                  ProductRepositoryPort productRepositoryPort,
                                  RuleRepositoryPort ruleRepositoryPort) {
        this.pricingEngineService = pricingEngineService;
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
    }

    @Override
    public SimulationResult simulate(SimulationRequest request) {
        long start = System.nanoTime();
        if (request == null || (request.ruleId() == null && request.rule() == null)) {
            throw new IllegalArgumentException("Selecciona una regla para simular.");
        }
        if (request.productIds() == null || request.productIds().isEmpty()) {
            throw new IllegalArgumentException("Selecciona al menos un producto.");
        }

        List<Product> products = request.productIds().stream().distinct()
                .map(id -> productRepositoryPort.getProductById(id).orElseThrow(() -> new ProductNotFoundException(id)))
                .toList();
        List<PricingRule> currentRules = ruleRepositoryPort.getRules();
        PricingRule simulated = buildSimulatedRule(request, currentRules, products);

        // Reglas reales del sistema más la simulada (si es una existente, la reemplaza)
        List<PricingRule> rules = new ArrayList<>(currentRules.stream()
                .filter(r -> !Objects.equals(r.getId(), simulated.getId()))
                .toList());
        rules.add(simulated);

        List<ProductSimulation> results = products.stream().map(product -> {
            PriceCalculationResult r = pricingEngineService.calculateWith(product, rules);
            return new ProductSimulation(product.getId(), product.getName(), product.getSku(),
                    product.getProductStatus() == ProductStatus.ACTIVE,
                    product.getCurrentPrice() != null ? product.getCurrentPrice() : product.getBasePrice(),
                    product.getBasePrice(), product.getMinPrice(), product.getMaxPrice(),
                    r.getFinalPrice(), r.getCalculatedPrice(), r.isClampedToMax(), r.isClampedToMin(),
                    r.getAppliedRuleIds().contains(simulated.getId()), r.getAppliedRuleIds());
        }).toList();

        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        return new SimulationResult(true, request.ruleId(), PricingRule.currentBusinessTime(), elapsedMs, results);
    }

    /**
     * La regla simulada se aplica a los productos elegidos, se considera activa y vigente hoy
     * (la pregunta es "¿qué pasaría si esta regla aplicara ahora?"). Una regla nueva entra al final de la prioridad,
     * igual que al crearla.
     */
    private PricingRule buildSimulatedRule(SimulationRequest request, List<PricingRule> currentRules,
                                           List<Product> products) {
        List<Integer> productIds = products.stream().map(p -> p.getId().intValue()).toList();
        PricingRule existing = null;
        if (request.ruleId() != null) {
            existing = currentRules.stream().filter(r -> Objects.equals(r.getId(), request.ruleId())).findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("La regla " + request.ruleId() + " no existe."));
        }

        // Condición y efecto: los del borrador si viene, si no los de la regla existente
        RuleDraft d = request.rule() != null ? request.rule()
                : new RuleDraft(existing.getVariableType(), existing.getLevel(), existing.getTimeCondition(),
                        existing.getEffectType(), existing.getEffectValue());
        validateDraft(d);

        int id = existing != null ? existing.getId() : NEW_RULE_ID;
        PricingRule simulated = d.variableType() == VariableType.TEMPORAL
                ? new PricingRule(id, d.variableType(), RuleStatus.ACTIVE, d.timeCondition(), d.effectType(), d.effectValue(), productIds)
                : new PricingRule(id, d.variableType(), RuleStatus.ACTIVE, d.level(), d.effectType(), d.effectValue(), productIds);
        simulated.setPriority(existing != null ? existing.getPriority() : nextPriority(currentRules));
        return simulated;
    }

    private void validateDraft(RuleDraft d) {
        if (d.variableType() == null) {
            throw new IllegalArgumentException("La variable de la regla es obligatoria.");
        }
        if (d.variableType() == VariableType.TEMPORAL ? d.timeCondition() == null : d.level() == null) {
            throw new IllegalArgumentException("La condición de la regla es obligatoria.");
        }
        if (d.effectType() == null || d.effectValue() == null) {
            throw new IllegalArgumentException("El efecto de la regla es obligatorio.");
        }
    }

    private int nextPriority(List<PricingRule> rules) {
        return rules.stream().map(PricingRule::getPriority).filter(Objects::nonNull)
                .max(Integer::compareTo).orElse(0) + 1;
    }
}
