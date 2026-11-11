package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.InitialPrice;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceHistoryEntry;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceUpdate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PriceTraceRepositoryPort {
    Long save(PriceCalculationResult result);
    List<PriceUpdate> findSince(LocalDateTime from);
    List<PriceUpdate> findRecentChanges(int limit);

    // HU14: cambios de un producto en [from, to), del más reciente al más antiguo, hasta limit registros
    List<PriceHistoryEntry> findChangesByProductBetween(Long productId, LocalDateTime from, LocalDateTime to, int limit);
    long countChangesByProductBetween(Long productId, LocalDateTime from, LocalDateTime to);
    long countChangesByProduct(Long productId);
    long countIncreasesByProduct(Long productId);
    long countDecreasesByProduct(Long productId);
    Optional<InitialPrice> findInitialPrice(Long productId);
}
