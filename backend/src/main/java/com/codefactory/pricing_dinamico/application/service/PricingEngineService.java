package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.CalculateFinalPriceUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PricingEngineService implements CalculateFinalPriceUseCase {

    private static final Locale ES = Locale.forLanguageTag("es");
    private static final Logger log = LoggerFactory.getLogger(PricingEngineService.class);

    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;
    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;
    private final PriceTraceRepositoryPort priceTraceRepositoryPort;

    public PricingEngineService(ProductRepositoryPort productRepositoryPort,
                                RuleRepositoryPort ruleRepositoryPort,
                                BusinessVariableRepositoryPort businessVariableRepositoryPort,
                                PriceTraceRepositoryPort priceTraceRepositoryPort) {
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
        this.priceTraceRepositoryPort = priceTraceRepositoryPort;
    }

    @Override
    public PriceCalculationResult calculateFinalPrice(Long productId) {
        // Todo se lee en el momento de la solicitud: cálculo en tiempo real, sin caché
        Product product = productRepositoryPort.getProductById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        LocalDateTime now = PricingRule.currentBusinessTime();
        BigDecimal basePrice = product.getBasePrice();

        // HU03: un producto inactivo mantiene su precio base y no evalúa reglas
        if (product.getProductStatus() == ProductStatus.INACTIVE) {
            return new PriceCalculationResult(product.getId(), basePrice, basePrice, basePrice,
                    false, false, List.of(), Map.of(),
                    "Producto inactivo: se mantiene el precio base sin evaluar reglas.", now);
        }

        // 1. Evaluar las variables de negocio contra el estado actual del producto
        Map<VariableType, BusinessVariable> variables = businessVariableRepositoryPort.getAllVariables()
                .stream().collect(Collectors.toMap(BusinessVariable::getVariableType, v -> v));
        Map<VariableType, Set<String>> activeConditions = new EnumMap<>(VariableType.class);
        Map<String, String> evaluated = new LinkedHashMap<>();
        evaluateDemand(product, variables.get(VariableType.DEMANDA), activeConditions, evaluated);
        evaluateAvailability(product, variables.get(VariableType.DISPONIBILIDAD), activeConditions, evaluated);
        evaluateTemporal(now, variables.get(VariableType.TEMPORAL), activeConditions, evaluated);
        log.debug("[Producto {}] Variables evaluadas: {}", product.getId(), evaluated);

        // 2. Reglas activas, vigentes, del producto y cuya condición se cumple, por prioridad
        List<PricingRule> applicableRules = ruleRepositoryPort.getRules().stream()
                .filter(rule -> rule.getRuleStatus() == RuleStatus.ACTIVE)
                .filter(rule -> rule.isInEffectAt(now))
                .filter(rule -> rule.getProductIds() != null && rule.getProductIds().contains(product.getId().intValue()))
                .filter(rule -> matches(rule, activeConditions))
                .sorted(PricingRule.BY_PRIORITY)
                .toList();

        // 3. Aplicar efectos en orden, registrando cada paso
        BigDecimal price = basePrice;
        List<AppliedRuleStep> steps = new ArrayList<>();
        for (PricingRule rule : applicableRules) {
            BigDecimal before = price;
            price = applyEffect(price, rule.getEffectType(), rule.getEffectValue());
            steps.add(new AppliedRuleStep(rule.getId(), rule.getPriority(), rule.getVariableType(),
                    conditionOf(rule), rule.getEffectType(), rule.getEffectValue(), before, price));
            log.debug("[Producto {}] Regla {} (prioridad {}, {} = {}): {} {} → precio {} a {}",
                    product.getId(), rule.getId(), rule.getPriority(),
                    rule.getVariableType(), conditionOf(rule),
                    rule.getEffectType(), rule.getEffectValue(), before, price);
        }

        // 4. Acotar estrictamente a los límites del producto (HU01)
        BigDecimal calculatedPrice = price;
        boolean clampedToMax = false;
        boolean clampedToMin = false;
        if (price.compareTo(product.getMaxPrice()) > 0) {
            price = product.getMaxPrice();
            clampedToMax = true;
        } else if (price.compareTo(product.getMinPrice()) < 0) {
            price = product.getMinPrice();
            clampedToMin = true;
        }

        String summary;
        if (steps.isEmpty()) {
            summary = "No se aplicó ninguna regla: se mantiene el precio base.";
        } else if (clampedToMax) {
            summary = "Se aplicaron " + steps.size() + " regla(s). El resultado " + calculatedPrice
                    + " superó el máximo y fue acotado por el límite superior (" + price + ").";
        } else if (clampedToMin) {
            summary = "Se aplicaron " + steps.size() + " regla(s). El resultado " + calculatedPrice
                    + " quedó por debajo del mínimo y fue acotado por el límite inferior (" + price + ").";
        } else {
            summary = "Se aplicaron " + steps.size() + " regla(s) dentro de los límites del producto.";
        }

        return new PriceCalculationResult(product.getId(), basePrice, calculatedPrice, price,
                clampedToMax, clampedToMin, steps, evaluated, summary, now);
    }

    public PriceCalculationResult recalculate(Long productId, TriggerType type, String detail) {
        Product product = productRepositoryPort.getProductById(productId).orElse(null);
        if (product == null) return null;

        PriceCalculationResult result = calculateFinalPrice(productId);   // solo calcula
        result.setPreviousPrice(product.getCurrentPrice());
        result.setTriggerType(type);
        result.setTriggerDetail(detail);

        productRepositoryPort.updateCurrentPrice(productId, result.getFinalPrice(), result.getCalculatedAt());
        result.setTraceId(priceTraceRepositoryPort.save(result));

        log.info("[Producto {}] {} ({}): {} → {}. {} Traza #{}", productId, detail, type,
                product.getCurrentPrice(), result.getFinalPrice(), result.getSummary(), result.getTraceId());
        return result;
    }

    public void recalculateAll(TriggerType type, String detail) {
        productRepositoryPort.getAllProducts().forEach(p -> recalculate(p.getId(), type, detail));
    }

    // ---- Evaluación de variables ----

    private void evaluateDemand(Product product, BusinessVariable variable,
                                Map<VariableType, Set<String>> active, Map<String, String> evaluated) {
        if (variable instanceof DemandVariable d && product.getProductDemand() != null) {
            double value = product.getProductDemand().doubleValue();
            String level = levelOf(value, d.getDemandLow(), d.getDemandHigh(), "BAJO", "NORMAL", "ALTO");
            active.put(VariableType.DEMANDA, Set.of(level));
            evaluated.put("DEMANDA", value + "% → " + level);
        } else {
            evaluated.put("DEMANDA", "Sin configurar");
        }
    }

    private void evaluateAvailability(Product product, BusinessVariable variable,
                                      Map<VariableType, Set<String>> active, Map<String, String> evaluated) {
        if (variable instanceof AvailabilityVariable a && product.getProductAvailability() != null) {
            double value = product.getProductAvailability().doubleValue();
            String level = levelOf(value, a.getAvailabilityLow(), a.getAvailabilityHigh(), "CRITICO", "BAJO", "NORMAL");
            active.put(VariableType.DISPONIBILIDAD, Set.of(level));
            evaluated.put("DISPONIBILIDAD", value + "% → " + level);
        } else {
            evaluated.put("DISPONIBILIDAD", "Sin configurar");
        }
    }

    private void evaluateTemporal(LocalDateTime now, BusinessVariable variable,
                                  Map<VariableType, Set<String>> active, Map<String, String> evaluated) {
        if (!(variable instanceof TemporalVariable t)) {
            evaluated.put("TEMPORAL", "Sin configurar");
            return;
        }
        Set<String> conditions = new HashSet<>();
        LocalTime time = now.toLocalTime();
        if (within(time, t.getMorningStartTime(), t.getMorningEndTime())
                || within(time, t.getAfternoonStartTime(), t.getAfternoonEndTime())) {
            conditions.add(TimeConditionType.HORA_PICO.name());
        }
        String month = now.getMonth().getDisplayName(TextStyle.FULL, ES);
        if (t.getHighSeasonMonths() != null
                && t.getHighSeasonMonths().stream().anyMatch(m -> m.equalsIgnoreCase(month))) {
            conditions.add(TimeConditionType.TEMPORADA_ALTA.name());
        }
        active.put(VariableType.TEMPORAL, conditions);
        evaluated.put("TEMPORAL", time.withNano(0) + ", " + month + " → "
                + (conditions.isEmpty() ? "sin condición activa" : String.join(", ", conditions)));
    }

    private String levelOf(double value, Long low, Long high, String lowLabel, String midLabel, String highLabel) {
        if (value <= low) return lowLabel;
        if (value >= high) return highLabel;
        return midLabel;
    }

    private boolean within(LocalTime time, LocalTime start, LocalTime end) {
        return start != null && end != null && !time.isBefore(start) && time.isBefore(end);
    }

    // ---- Reglas ----

    private boolean matches(PricingRule rule, Map<VariableType, Set<String>> activeConditions) {
        String expected = conditionOf(rule);
        return expected != null
                && activeConditions.getOrDefault(rule.getVariableType(), Set.of()).contains(expected);
    }

    private String conditionOf(PricingRule rule) {
        if (rule.getVariableType() == VariableType.TEMPORAL) {
            return rule.getTimeCondition() == null ? null : rule.getTimeCondition().name();
        }
        return rule.getLevel() == null ? null : rule.getLevel().name();
    }

    private BigDecimal applyEffect(BigDecimal price, EffectType effectType, BigDecimal effectValue) {
        BigDecimal result = effectType == EffectType.PORCENTAJE
                ? price.multiply(BigDecimal.ONE.add(effectValue.divide(BigDecimal.valueOf(100))))
                : price.add(effectValue);
        return result.setScale(2, RoundingMode.HALF_UP);
    }
}