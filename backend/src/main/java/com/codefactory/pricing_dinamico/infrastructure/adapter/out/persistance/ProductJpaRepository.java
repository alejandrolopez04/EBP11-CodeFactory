package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, Long> {
    boolean existsBySku(String sku);

    List<ProductJpaEntity> findByProductStatus(ProductStatus productStatus);

    List<ProductJpaEntity> findByCategory(String category);

    List<ProductJpaEntity> findByProductStatusAndCategory(ProductStatus productStatus, String category);
}
