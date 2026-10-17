package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceUpdate;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PriceTraceRepositoryAdapter implements PriceTraceRepositoryPort {
    private final PriceTraceJpaRepository priceTraceJpaRepository;
    private final ObjectMapper objectMapper;

    public PriceTraceRepositoryAdapter(PriceTraceJpaRepository priceTraceJpaRepository, ObjectMapper objectMapper) {
        this.priceTraceJpaRepository = priceTraceJpaRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Long save(PriceCalculationResult r) {
        PriceTraceJpaEntity entity = new PriceTraceJpaEntity(r.getProductId(), r.getBasePrice(),
                r.getPreviousPrice(), r.getCalculatedPrice(), r.getFinalPrice(),
                r.isClampedToMax(), r.isClampedToMin(), r.getSummary(),
                r.getTriggerType(), r.getTriggerDetail(),
                objectMapper.writeValueAsString(r), r.getCalculatedAt());
        return priceTraceJpaRepository.save(entity).getId();
    }

    @Override
    public List<PriceUpdate> findSince(LocalDateTime from) {
        return priceTraceJpaRepository.findByCalculatedAtGreaterThanEqual(from).stream()
                .map(this::toPriceUpdate)
                .toList();
    }

    @Override
    public List<PriceUpdate> findRecentChanges(int limit) {
        return priceTraceJpaRepository.findRecentChanges(PageRequest.of(0, limit)).stream()
                .map(this::toPriceUpdate)
                .toList();
    }

    private PriceUpdate toPriceUpdate(PriceTraceJpaEntity e) {
        return new PriceUpdate(e.getId(), e.getProductId(), e.getPreviousPrice(), e.getFinalPrice(),
                e.getTriggerType(), e.getTriggerDetail(), e.isClampedToMax(), e.isClampedToMin(),
                e.getCalculatedAt());
    }
}