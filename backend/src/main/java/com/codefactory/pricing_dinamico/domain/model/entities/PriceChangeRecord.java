package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Registro inmutable de un cambio de precio (record de Java: sin setters, sin mutación posible).
 * Solo se crea cuando el precio realmente cambia.
 */
public record PriceChangeRecord(Long id, Long productId, BigDecimal previousPrice, BigDecimal newPrice,
                                LocalDateTime changedAt, ChangeCause cause, List<Integer> ruleIds,
                                String variable, String variableValue, String changedBy, String detail) {

    public PriceChangeRecord {
        Objects.requireNonNull(productId, "productId");
        Objects.requireNonNull(previousPrice, "previousPrice");
        Objects.requireNonNull(newPrice, "newPrice");
        Objects.requireNonNull(changedAt, "changedAt");
        Objects.requireNonNull(cause, "cause");
        if (previousPrice.compareTo(newPrice) == 0) {
            throw new IllegalArgumentException("No se registra un cambio si el precio no varía.");
        }
        ruleIds = ruleIds == null ? List.of() : List.copyOf(ruleIds);
    }

    public BigDecimal delta() {
        return newPrice.subtract(previousPrice);
    }

    /** Variación porcentual respecto al precio anterior; null si el precio anterior es 0. */
    public BigDecimal deltaPercent() {
        if (previousPrice.signum() == 0) return null;
        return delta().multiply(BigDecimal.valueOf(100)).divide(previousPrice, 2, RoundingMode.HALF_UP);
    }
}
