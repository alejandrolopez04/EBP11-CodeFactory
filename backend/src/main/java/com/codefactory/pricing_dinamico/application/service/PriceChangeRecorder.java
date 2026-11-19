package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.PriceChangeRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Reporte de impacto: registra un cambio de precio inmutable cuando el motor aplica un precio distinto
 * al actual. Deduce la regla o la variable de origen del detalle del disparador, con el mismo formato
 * que ya consume PriceHistoryService ("Regla N ...", "Variables de negocio actualizadas (A, B)").
 */
@Component
public class PriceChangeRecorder {
    private static final Pattern RULE_ID = Pattern.compile("Regla (\\d+)");
    private static final Pattern VARIABLES = Pattern.compile("\\(([A-Z_, ]+)\\)");

    private final PriceChangeRepositoryPort priceChangeRepositoryPort;
    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;

    public PriceChangeRecorder(PriceChangeRepositoryPort priceChangeRepositoryPort,
                               BusinessVariableRepositoryPort businessVariableRepositoryPort) {
        this.priceChangeRepositoryPort = priceChangeRepositoryPort;
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
    }

    /** Debe llamarse cuando el resultado ya trae precio anterior, disparador y detalle. */
    public void record(PriceCalculationResult result) {
        BigDecimal previous = result.getPreviousPrice();
        if (previous == null || previous.compareTo(result.getFinalPrice()) == 0) return;

        String detail = result.getTriggerDetail() == null ? "" : result.getTriggerDetail();
        TriggerType type = result.getTriggerType();
        ChangeCause cause = causeOf(type);
        if (cause == ChangeCause.PRODUCTO) return;

        List<Integer> ruleIds = List.of();
        if (cause == ChangeCause.REGLA) {
            Matcher m = RULE_ID.matcher(detail);
            ruleIds = m.find() ? List.of(Integer.valueOf(m.group(1))) : result.getAppliedRuleIds();
        } else if (cause == ChangeCause.HORARIO) {
            ruleIds = result.getAppliedRuleIds();
        }

        String variable = null;
        String variableValue = null;
        if (cause == ChangeCause.VARIABLE) {
            List<String> names = variablesIn(detail);
            variable = String.join(", ", names);
            variableValue = describeVariables(names);
        }

        priceChangeRepositoryPort.save(new PriceChangeRecord(null, result.getProductId(), previous,
                result.getFinalPrice(), result.getCalculatedAt(), cause, ruleIds, variable, variableValue,
                "Sistema", detail.isBlank() ? null : detail));
    }

    private ChangeCause causeOf(TriggerType type) {
        if (type == null) return ChangeCause.OTRO;
        return switch (type) {
            case VARIABLES -> ChangeCause.VARIABLE;
            case REGLA -> ChangeCause.REGLA;
            case HORARIO -> ChangeCause.HORARIO;
            case PRODUCTO -> ChangeCause.PRODUCTO;
            default -> ChangeCause.OTRO;
        };
    }

    private List<String> variablesIn(String detail) {
        Matcher m = VARIABLES.matcher(detail);
        if (!m.find()) return List.of();
        return Arrays.stream(m.group(1).split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** Valor vigente de cada variable modificada (sus umbrales u horarios configurados). */
    private String describeVariables(List<String> names) {
        return businessVariableRepositoryPort.getAllVariables().stream()
                .filter(v -> v.getVariableType() != null
                        && (names.isEmpty() || names.contains(v.getVariableType().name())))
                .map(this::describe)
                .collect(Collectors.joining("; "));
    }

    private String describe(BusinessVariable v) {
        if (v instanceof DemandVariable d) {
            return "DEMANDA: bajo ≤ " + d.getDemandLow() + "%, alto ≥ " + d.getDemandHigh() + "%";
        }
        if (v instanceof AvailabilityVariable a) {
            return "DISPONIBILIDAD: crítico ≤ " + a.getAvailabilityLow() + "%, normal ≥ " + a.getAvailabilityHigh() + "%";
        }
        if (v instanceof TemporalVariable t) {
            return "TEMPORAL: mañana " + t.getMorningStartTime() + "–" + t.getMorningEndTime()
                    + ", tarde " + t.getAfternoonStartTime() + "–" + t.getAfternoonEndTime()
                    + ", temporada alta " + t.getHighSeasonMonths();
        }
        return String.valueOf(v.getVariableType());
    }
}
