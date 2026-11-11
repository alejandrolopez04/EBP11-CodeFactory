package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PriceTraceJpaRepository extends JpaRepository<PriceTraceJpaEntity, Long> {
    List<PriceTraceJpaEntity> findByCalculatedAtGreaterThanEqual(LocalDateTime from);

    @Query("SELECT t FROM PriceTraceJpaEntity t " +
            "WHERE t.previousPrice IS NOT NULL AND t.previousPrice <> t.finalPrice " +
            "ORDER BY t.calculatedAt DESC, t.id DESC")
    List<PriceTraceJpaEntity> findRecentChanges(Pageable pageable);

    // HU14: cambios de un producto en [from, to), del más reciente al más antiguo
    @Query("SELECT t FROM PriceTraceJpaEntity t " +
            "WHERE t.productId = :productId " +
            "AND t.previousPrice IS NOT NULL AND t.previousPrice <> t.finalPrice " +
            "AND t.calculatedAt >= :from AND t.calculatedAt < :to " +
            "ORDER BY t.calculatedAt DESC, t.id DESC")
    List<PriceTraceJpaEntity> findChangesByProductBetween(@Param("productId") Long productId,
                                                          @Param("from") LocalDateTime from,
                                                          @Param("to") LocalDateTime to, Pageable pageable);

    @Query("SELECT COUNT(t) FROM PriceTraceJpaEntity t " +
            "WHERE t.productId = :productId " +
            "AND t.previousPrice IS NOT NULL AND t.previousPrice <> t.finalPrice " +
            "AND t.calculatedAt >= :from AND t.calculatedAt < :to")
    long countChangesByProductBetween(@Param("productId") Long productId,
                                      @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(t) FROM PriceTraceJpaEntity t " +
            "WHERE t.productId = :productId " +
            "AND t.previousPrice IS NOT NULL AND t.previousPrice <> t.finalPrice")
    long countChangesByProduct(@Param("productId") Long productId);

    @Query("SELECT COUNT(t) FROM PriceTraceJpaEntity t " +
            "WHERE t.productId = :productId " +
            "AND t.previousPrice IS NOT NULL AND t.finalPrice > t.previousPrice")
    long countIncreasesByProduct(@Param("productId") Long productId);

    @Query("SELECT COUNT(t) FROM PriceTraceJpaEntity t " +
            "WHERE t.productId = :productId " +
            "AND t.previousPrice IS NOT NULL AND t.finalPrice < t.previousPrice")
    long countDecreasesByProduct(@Param("productId") Long productId);

    Optional<PriceTraceJpaEntity> findFirstByProductIdOrderByIdAsc(Long productId);
}
