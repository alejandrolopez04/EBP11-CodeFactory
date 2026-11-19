package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceImpactReportUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PriceChangeRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PriceImpactReportService implements GetPriceImpactReportUseCase {

    private final PriceChangeRepositoryPort priceChangeRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;

    public PriceImpactReportService(PriceChangeRepositoryPort priceChangeRepositoryPort,
                                    ProductRepositoryPort productRepositoryPort) {
        this.priceChangeRepositoryPort = priceChangeRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
    }

    @Override
    public List<PriceChangeRecord> getChanges(ReportFilter filter) {
        if (filter.from() != null && filter.to() != null && filter.to().isBefore(filter.from())) {
            throw new IllegalArgumentException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        return priceChangeRepositoryPort.find(filter.productId(), filter.from(), filter.to(), filter.cause());
    }

    @Override
    public PriceImpactReport getReport(ReportFilter filter) {
        List<PriceChangeRecord> records = getChanges(filter);

        Map<Long, String> names = new HashMap<>();
        for (Product p : productRepositoryPort.getAllProducts()) {
            names.put(p.getId(), p.getName());
        }
        List<ChangeRow> rows = records.stream()
                .map(r -> new ChangeRow(r.id(), r.productId(),
                        names.getOrDefault(r.productId(), "Producto #" + r.productId()),
                        r.previousPrice(), r.newPrice(), r.changedAt(), r.cause(), r.ruleIds(),
                        r.variable(), r.variableValue(), r.changedBy(), r.detail()))
                .toList();

        return new PriceImpactReport(filter, PriceImpactCalculator.summarize("TOTAL", records),
                PriceImpactCalculator.byCause(records), PriceImpactCalculator.byRule(records), rows);
    }
}
