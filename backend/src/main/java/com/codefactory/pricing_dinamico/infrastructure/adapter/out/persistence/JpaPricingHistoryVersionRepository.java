package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.application.port.out.PricingHistoryVersionRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaPricingHistoryVersionRepository
        implements PricingHistoryVersionRepositoryPort {

    private final SpringDataPricingHistoryVersionRepository springDataRepository;

    public JpaPricingHistoryVersionRepository(
            SpringDataPricingHistoryVersionRepository springDataRepository
    ) {
        this.springDataRepository = springDataRepository;
    }

    @Override
    public PricingHistoryVersion save(PricingHistoryVersion version) {
        return springDataRepository.save(version);
    }

    @Override
    public Optional<PricingHistoryVersion> findByTraceId(Long traceId) {
        return springDataRepository.findByTraceId(traceId);
    }

    @Override
    public List<PricingHistoryVersion> findByProductIdOrderByCreatedAtDesc(Long productId) {
        return springDataRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
}
