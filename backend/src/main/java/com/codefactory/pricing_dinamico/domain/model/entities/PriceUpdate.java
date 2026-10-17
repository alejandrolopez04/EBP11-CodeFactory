package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriceUpdate(Long traceId, Long productId, BigDecimal previousPrice, BigDecimal finalPrice,
                          TriggerType triggerType, String triggerDetail, boolean clampedToMax,
                          boolean clampedToMin, LocalDateTime calculatedAt) {
    public boolean priceChanged() {
        return previousPrice != null && previousPrice.compareTo(finalPrice) != 0;
    }
}
