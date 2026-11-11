package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface GetPriceHistoryUseCase {
    /** Tipo de un cambio según lo que lo disparó; null = actualización manual del producto (sin regla). */
    enum ChangeType { HORARIO, DEMANDA, DISPONIBILIDAD }

    /**
     * Cambios de un rango de fechas (más reciente primero, hasta el límite). Los totales son de todo el historial;
     * rangeChanges es cuántos cambios hay en el rango y truncated indica si se devolvieron menos.
     */
    record PriceHistory(Long productId, String productName, String sku, ProductStatus productStatus,
                        BigDecimal basePrice, BigDecimal currentPrice, Creation creation, long totalChanges,
                        long increases, long decreases, LocalDate from, LocalDate to, long rangeChanges,
                        boolean truncated, List<PriceChange> changes) {}

    record Creation(BigDecimal basePrice, LocalDateTime at) {}

    record PriceChange(Long traceId, BigDecimal previousPrice, BigDecimal newPrice,
                       TriggerType triggerType, String trigger, ChangeType changeType,
                       List<Integer> appliedRuleIds, boolean clampedToMax, boolean clampedToMin,
                       LocalDateTime at) {}

    /** from y to son inclusivos; null = sin límite por ese lado. */
    PriceHistory getPriceHistory(Long productId, LocalDate from, LocalDate to);
}
