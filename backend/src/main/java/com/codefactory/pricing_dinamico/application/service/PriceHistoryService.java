package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceHistoryUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceHistoryEntry;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductNotFoundException;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PriceHistoryService implements GetPriceHistoryUseCase {
    /** Tope de cambios por consulta: la gráfica y la tabla siguen siendo legibles y rápidas con históricos extensos. */
    private static final int MAX_CHANGES = 200;
    private static final Pattern RULE_ID = Pattern.compile("Regla (\\d+)");
    private static final Pattern VARIABLES = Pattern.compile("\\(([A-Z_, ]+)\\)");

    private final PriceTraceRepositoryPort priceTraceRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;

    public PriceHistoryService(PriceTraceRepositoryPort priceTraceRepositoryPort,
                               ProductRepositoryPort productRepositoryPort,
                               RuleRepositoryPort ruleRepositoryPort) {
        this.priceTraceRepositoryPort = priceTraceRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
    }

    @Override
    public PriceHistory getPriceHistory(Long productId, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la final.");
        }
        Product product = productRepositoryPort.getProductById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        // Sin traza inicial (productos anteriores al registro de trazas) se usa el precio base actual
        Creation creation = priceTraceRepositoryPort.findInitialPrice(productId)
                .map(i -> new Creation(i.basePrice(), i.at()))
                .orElse(new Creation(product.getBasePrice(), null));

        LocalDateTime start = from != null ? from.atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = to != null ? to.plusDays(1).atStartOfDay() : LocalDateTime.of(9999, 1, 1, 0, 0);

        Map<Integer, VariableType> ruleTypes = ruleRepositoryPort.getRules().stream()
                .filter(r -> r.getId() != null && r.getVariableType() != null)
                .collect(Collectors.toMap(PricingRule::getId, PricingRule::getVariableType, (a, b) -> a));
        long rangeChanges = priceTraceRepositoryPort.countChangesByProductBetween(productId, start, end);
        List<PriceChange> changes = priceTraceRepositoryPort
                .findChangesByProductBetween(productId, start, end, MAX_CHANGES).stream()
                .map(e -> new PriceChange(e.traceId(), e.previousPrice(), e.finalPrice(),
                        e.triggerType(), e.triggerDetail(), changeTypeOf(e, ruleTypes), e.appliedRuleIds(),
                        e.clampedToMax(), e.clampedToMin(), e.calculatedAt()))
                .toList();

        return new PriceHistory(product.getId(), product.getName(), product.getSku(), product.getProductStatus(),
                product.getBasePrice(), product.getCurrentPrice(), creation,
                priceTraceRepositoryPort.countChangesByProduct(productId),
                priceTraceRepositoryPort.countIncreasesByProduct(productId),
                priceTraceRepositoryPort.countDecreasesByProduct(productId),
                from, to, rangeChanges, rangeChanges > changes.size(), changes);
    }

    /**
     * Clasifica un cambio según lo que lo disparó:
     * actualización del producto → sin regla; franja horaria → horario; regla creada o editada → tipo de esa regla;
     * variables de negocio → tipo de la variable modificada. Si el disparador no lo aclara,
     * se usa la regla de mayor prioridad aplicada.
     */
    private ChangeType changeTypeOf(PriceHistoryEntry e, Map<Integer, VariableType> ruleTypes) {
        if (e.triggerType() == null) return toChangeType(e.primaryVariable());
        String detail = e.triggerDetail() == null ? "" : e.triggerDetail();
        return switch (e.triggerType()) {
            case PRODUCTO -> null;
            case HORARIO -> ChangeType.HORARIO;
            case REGLA -> {
                Matcher m = RULE_ID.matcher(detail);
                VariableType type = m.find() ? ruleTypes.get(Integer.valueOf(m.group(1))) : null;
                yield toChangeType(type != null ? type : e.primaryVariable());
            }
            case VARIABLES -> {
                Matcher m = VARIABLES.matcher(detail);
                List<String> changed = m.find()
                        ? List.of(m.group(1).replace(" ", "").split(","))
                        : List.of();
                // Si se modificaron varias variables, la que pesa es la de la regla de mayor prioridad aplicada
                if (e.primaryVariable() != null && (changed.isEmpty() || changed.contains(e.primaryVariable().name()))) {
                    yield toChangeType(e.primaryVariable());
                }
                yield changed.isEmpty() ? null : toChangeType(VariableType.valueOf(changed.get(0)));
            }
            case MANUAL, INICIO -> toChangeType(e.primaryVariable());
        };
    }

    private ChangeType toChangeType(VariableType type) {
        if (type == null) return null;
        return switch (type) {
            case TEMPORAL -> ChangeType.HORARIO;
            case DEMANDA -> ChangeType.DEMANDA;
            case DISPONIBILIDAD -> ChangeType.DISPONIBILIDAD;
        };
    }
}
