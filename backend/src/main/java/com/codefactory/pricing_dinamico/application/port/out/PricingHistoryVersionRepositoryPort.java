package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;

import java.util.List;
import java.util.Optional;

public interface PricingHistoryVersionRepositoryPort {

    PricingHistoryVersion save(PricingHistoryVersion version);

    Optional<PricingHistoryVersion> findByTraceId(Long traceId);

    List<PricingHistoryVersion> findByProductIdOrderByCreatedAtDesc(Long productId);
}
