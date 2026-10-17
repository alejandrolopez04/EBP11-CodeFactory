package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface GetPricingDashboardUseCase {
    record PricingDashboard(long activeProducts, long activeRules, long updatesToday,
                                   long productsAffectedToday, long increasesToday, long decreasesToday,
                                   NextChange nextChange, List<RecentUpdate> recentUpdates) {}

    record NextChange(LocalDateTime at, String description, int products) {}

    record RecentUpdate(Long traceId, String productName, BigDecimal previousPrice, BigDecimal finalPrice,
                               TriggerType triggerType, String trigger, boolean clampedToMax,
                               boolean clampedToMin, LocalDateTime at) {}

    PricingDashboard getDashboard();
}
