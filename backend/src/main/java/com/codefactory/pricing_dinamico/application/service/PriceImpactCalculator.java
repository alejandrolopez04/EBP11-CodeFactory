package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceImpactReportUseCase.ImpactSummary;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/** Agregaciones puras del reporte de impacto (sin dependencias de Spring). */
public final class PriceImpactCalculator {

    private PriceImpactCalculator() {}

    public static ImpactSummary summarize(String key, List<PriceChangeRecord> records) {
        long up = records.stream().filter(r -> r.delta().signum() > 0).count();
        long down = records.stream().filter(r -> r.delta().signum() < 0).count();
        BigDecimal net = records.stream().map(PriceChangeRecord::delta).reduce(BigDecimal.ZERO, BigDecimal::add);
        List<BigDecimal> percents = records.stream().map(PriceChangeRecord::deltaPercent)
                .filter(Objects::nonNull).toList();
        BigDecimal avg = percents.isEmpty() ? BigDecimal.ZERO
                : percents.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(percents.size()), 2, RoundingMode.HALF_UP);
        return new ImpactSummary(key, records.size(), up, down, net, avg);
    }

    public static List<ImpactSummary> byCause(List<PriceChangeRecord> records) {
        Map<String, List<PriceChangeRecord>> groups = new LinkedHashMap<>();
        records.forEach(r -> groups.computeIfAbsent(r.cause().name(), k -> new ArrayList<>()).add(r));
        return groups.entrySet().stream()
                .map(e -> summarize(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(ImpactSummary::changes).reversed())
                .toList();
    }

    /** Un cambio originado por varias reglas cuenta en cada una de ellas. */
    public static List<ImpactSummary> byRule(List<PriceChangeRecord> records) {
        Map<Integer, List<PriceChangeRecord>> groups = new TreeMap<>();
        records.forEach(r -> r.ruleIds().forEach(id -> groups.computeIfAbsent(id, k -> new ArrayList<>()).add(r)));
        return groups.entrySet().stream()
                .map(e -> summarize(String.valueOf(e.getKey()), e.getValue()))
                .toList();
    }
}
