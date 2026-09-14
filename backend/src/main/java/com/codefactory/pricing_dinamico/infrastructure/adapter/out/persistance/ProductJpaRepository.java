package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductJpaRepository extends JpaRepository<ProductJpaEntity, Long> {
    boolean existsBySku(String sku);
}
