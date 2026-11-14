package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface GetPriceComparisonUseCase {
    // Un cambio de precio dentro del período
    record PriceChange(LocalDateTime at, BigDecimal previousPrice, BigDecimal newPrice,
                       TriggerType triggerType, String trigger) {}

    // Comparación de un producto: precio actual vs. precio con el que empezó el período
    record ProductComparison(Long productId, String productName, BigDecimal currentPrice,
                             BigDecimal periodStartPrice, BigDecimal variation, BigDecimal variationPercent,
                             String trend, int changes, List<PriceChange> history, String message) {}

    record PriceComparison(int days, LocalDateTime from, LocalDateTime to, List<ProductComparison> products) {}

    PriceComparison compare(List<Long> productIds, Integer days);
}
