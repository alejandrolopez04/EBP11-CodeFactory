package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface GetPriceImpactReportUseCase {

    PriceImpactReport getReport(ReportFilter filter);

    List<PriceChangeRecord> getChanges(ReportFilter filter);

    record ReportFilter(Long productId, LocalDateTime from, LocalDateTime to, ChangeCause cause) {}

    /** Resumen de impacto de un grupo de cambios (por causa, por regla o total). */
    record ImpactSummary(String key, long changes, long increases, long decreases,
                         BigDecimal netDelta, BigDecimal avgChangePercent) {}

    record ChangeRow(Long id, Long productId, String productName, BigDecimal previousPrice,
                     BigDecimal newPrice, LocalDateTime changedAt, ChangeCause cause, List<Integer> ruleIds,
                     String variable, String variableValue, String changedBy, String detail) {}

    record PriceImpactReport(ReportFilter filter, ImpactSummary overall, List<ImpactSummary> byCause,
                             List<ImpactSummary> byRule, List<ChangeRow> changes) {}
}
