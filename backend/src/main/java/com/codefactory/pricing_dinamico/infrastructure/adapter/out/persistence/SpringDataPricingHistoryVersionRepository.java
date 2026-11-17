package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataPricingHistoryVersionRepository
        extends JpaRepository<PricingHistoryVersion, Long> {

    Optional<PricingHistoryVersion> findByTraceId(Long traceId);

    List<PricingHistoryVersion> findByProductIdOrderByCreatedAtDesc(Long productId);
}
