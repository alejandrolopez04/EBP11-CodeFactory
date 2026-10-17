package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, Long> {
    boolean existsBySku(String sku);

    List<ProductJpaEntity> findByProductStatus(ProductStatus productStatus);

    List<ProductJpaEntity> findByCategory(String category);

    List<ProductJpaEntity> findByProductStatusAndCategory(ProductStatus productStatus, String category);

    boolean existsBySkuAndIdNot(String sku, Long id);

    @Modifying
    @Transactional
    @Query("UPDATE ProductJpaEntity p SET p.currentPrice = :price, p.priceUpdatedAt = :at WHERE p.id = :id")
    void updateCurrentPrice(@Param("id") Long id, @Param("price") BigDecimal price, @Param("at") LocalDateTime at);
}
