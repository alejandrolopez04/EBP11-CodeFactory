package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.InitialPrice;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceHistoryEntry;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceUpdate;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Override
    public List<PriceHistoryEntry> findChangesByProductBetween(Long productId, LocalDateTime from, LocalDateTime to, int limit) {
        return priceTraceJpaRepository.findChangesByProductBetween(productId, from, to, PageRequest.of(0, limit)).stream()
                .map(this::toHistoryEntry)
                .toList();
    }

    @Override
    public long countChangesByProductBetween(Long productId, LocalDateTime from, LocalDateTime to) {
        return priceTraceJpaRepository.countChangesByProductBetween(productId, from, to);
    }

    @Override
    public long countChangesByProduct(Long productId) {
        return priceTraceJpaRepository.countChangesByProduct(productId);
    }

    @Override
    public long countIncreasesByProduct(Long productId) {
        return priceTraceJpaRepository.countIncreasesByProduct(productId);
    }

    @Override
    public long countDecreasesByProduct(Long productId) {
        return priceTraceJpaRepository.countDecreasesByProduct(productId);
    }

    @Override
    public Optional<InitialPrice> findInitialPrice(Long productId) {
        return priceTraceJpaRepository.findFirstByProductIdOrderByIdAsc(productId)
                .map(e -> new InitialPrice(e.getBasePrice(), e.getFinalPrice(), e.getCalculatedAt()));
    }

    /** Las reglas aplicadas y sus tipos solo se guardan dentro del payload JSON de la traza. */
    private PriceHistoryEntry toHistoryEntry(PriceTraceJpaEntity e) {
        List<Integer> ruleIds = new ArrayList<>();
        VariableType primaryVariable = null;
        if (e.getPayload() != null) {
            try {
                JsonNode root = objectMapper.readTree(e.getPayload());
                JsonNode ids = root.path("appliedRuleIds");
                for (int i = 0; i < ids.size(); i++) {
                    ruleIds.add(ids.get(i).asInt());
                }
                // Los pasos se guardan en orden de prioridad: el primero es la regla de mayor prioridad
                JsonNode steps = root.path("steps");
                if (steps.size() > 0) {
                    primaryVariable = VariableType.valueOf(steps.get(0).path("variableType").asText());
                }
            } catch (RuntimeException ex) {
                // Payload ilegible o sin tipo: el cambio se muestra sin reglas ni tipo
            }
        }
        return new PriceHistoryEntry(e.getId(), e.getPreviousPrice(), e.getFinalPrice(),
                e.getTriggerType(), e.getTriggerDetail(), e.isClampedToMax(), e.isClampedToMin(),
                ruleIds, primaryVariable, e.getCalculatedAt());
    }

    private PriceUpdate toPriceUpdate(PriceTraceJpaEntity e) {
        return new PriceUpdate(e.getId(), e.getProductId(), e.getPreviousPrice(), e.getFinalPrice(),
                e.getTriggerType(), e.getTriggerDetail(), e.isClampedToMax(), e.isClampedToMin(),
                e.getCalculatedAt());
    }
}