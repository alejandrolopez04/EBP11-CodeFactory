package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceComparisonUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceUpdate;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PriceComparisonService implements GetPriceComparisonUseCase {
    private static final int DEFAULT_DAYS = 30;
    private static final int MAX_DAYS = 365;

    private final PriceTraceRepositoryPort priceTraceRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;

    public PriceComparisonService(PriceTraceRepositoryPort priceTraceRepositoryPort,
                                  ProductRepositoryPort productRepositoryPort) {
        this.priceTraceRepositoryPort = priceTraceRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
    }

    @Override
    public PriceComparison compare(List<Long> productIds, Integer days) {
        if (productIds == null || productIds.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar al menos un producto.");
        }
        int period = (days == null) ? DEFAULT_DAYS : days;
        if (period < 1 || period > MAX_DAYS) {
            throw new IllegalArgumentException("El período debe estar entre 1 y " + MAX_DAYS + " días.");
        }

        List<Long> ids = productIds.stream().distinct().toList();
        LocalDateTime to = PricingRule.currentBusinessTime();
        LocalDateTime from = to.minusDays(period);

        // Solo los cambios reales de precio del período, ordenados cronológicamente
        Map<Long, List<PriceUpdate>> changesByProduct = priceTraceRepositoryPort.findSince(from).stream()
                .filter(PriceUpdate::priceChanged)
                .filter(u -> ids.contains(u.productId()))
                .sorted(Comparator.comparing(PriceUpdate::calculatedAt).thenComparing(PriceUpdate::traceId))
                .collect(Collectors.groupingBy(PriceUpdate::productId));

        List<ProductComparison> result = ids.stream()
                .map(id -> buildComparison(id, changesByProduct.getOrDefault(id, List.of())))
                .toList();

        return new PriceComparison(period, from, to, result);
    }

    private ProductComparison buildComparison(Long productId, List<PriceUpdate> changes) {
        Product product = productRepositoryPort.getProductById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        BigDecimal current = product.getCurrentPrice() != null ? product.getCurrentPrice() : product.getBasePrice();
        // Precio con el que empezó el período = precio anterior del primer cambio
        BigDecimal start = changes.isEmpty() ? current : changes.get(0).previousPrice();
        BigDecimal variation = current.subtract(start);
        BigDecimal percent = start.signum() == 0
                ? BigDecimal.ZERO
                : variation.multiply(BigDecimal.valueOf(100)).divide(start, 2, RoundingMode.HALF_UP);

        String trend = variation.signum() > 0 ? "UP" : variation.signum() < 0 ? "DOWN" : "STABLE";

        List<PriceChange> history = changes.stream()
                .map(u -> new PriceChange(u.calculatedAt(), u.previousPrice(), u.finalPrice(),
                        u.triggerType(), u.triggerDetail()))
                .toList();

        String message = history.isEmpty() ? "No hubo variaciones de precio en este período." : null;

        return new ProductComparison(product.getId(), product.getName(), current, start, variation, percent,
                trend, history.size(), history, message);
    }
}
