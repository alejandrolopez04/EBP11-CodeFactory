package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface PriceTraceJpaRepository extends JpaRepository<PriceTraceJpaEntity, Long> {
    List<PriceTraceJpaEntity> findByCalculatedAtGreaterThanEqual(LocalDateTime from);

    @Query("SELECT t FROM PriceTraceJpaEntity t " +
            "WHERE t.previousPrice IS NOT NULL AND t.previousPrice <> t.finalPrice " +
            "ORDER BY t.calculatedAt DESC, t.id DESC")
    List<PriceTraceJpaEntity> findRecentChanges(Pageable pageable);
}
