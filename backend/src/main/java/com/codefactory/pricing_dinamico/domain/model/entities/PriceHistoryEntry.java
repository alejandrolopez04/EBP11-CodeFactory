package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * HU14: un cambio de precio de un producto, con su causa y las reglas que se aplicaron.
 * primaryVariable es el tipo de variable de la regla de mayor prioridad aplicada (null si no se aplicó ninguna).
 */
public record PriceHistoryEntry(Long traceId, BigDecimal previousPrice, BigDecimal finalPrice,
                                TriggerType triggerType, String triggerDetail, boolean clampedToMax,
                                boolean clampedToMin, List<Integer> appliedRuleIds,
                                VariableType primaryVariable, LocalDateTime calculatedAt) {
}
