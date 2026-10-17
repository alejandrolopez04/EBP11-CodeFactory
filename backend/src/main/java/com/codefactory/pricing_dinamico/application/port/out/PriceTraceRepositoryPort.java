package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceUpdate;

import java.time.LocalDateTime;
import java.util.List;

public interface PriceTraceRepositoryPort {
    Long save(PriceCalculationResult result);
    List<PriceUpdate> findSince(LocalDateTime from);
    List<PriceUpdate> findRecentChanges(int limit);
}
