package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.PriceChangeRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Adaptador append-only: usa el EntityManager solo para persist y consultas.
 * No existe ningún método de actualización ni de borrado.
 */
@Component
public class PriceChangeRepositoryAdapter implements PriceChangeRepositoryPort {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public PriceChangeRecord save(PriceChangeRecord r) {
        PriceChangeJpaEntity entity = new PriceChangeJpaEntity(r.productId(), r.previousPrice(), r.newPrice(),
                r.changedAt(), r.cause(),
                r.ruleIds().isEmpty() ? null : r.ruleIds().stream().map(String::valueOf).collect(Collectors.joining(",")),
                r.variable(), r.variableValue(), r.changedBy(), r.detail());
        em.persist(entity);
        return toDomain(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceChangeRecord> find(Long productId, LocalDateTime from, LocalDateTime to, ChangeCause cause) {
        StringBuilder jpql = new StringBuilder("SELECT c FROM PriceChangeJpaEntity c WHERE 1 = 1");
        Map<String, Object> params = new HashMap<>();
        if (productId != null) { jpql.append(" AND c.productId = :productId"); params.put("productId", productId); }
        if (from != null) { jpql.append(" AND c.changedAt >= :from"); params.put("from", from); }
        if (to != null) { jpql.append(" AND c.changedAt <= :to"); params.put("to", to); }
        if (cause != null) { jpql.append(" AND c.cause = :cause"); params.put("cause", cause); }
        jpql.append(" ORDER BY c.changedAt DESC, c.id DESC");

        TypedQuery<PriceChangeJpaEntity> query = em.createQuery(jpql.toString(), PriceChangeJpaEntity.class);
        params.forEach(query::setParameter);
        return query.getResultList().stream().map(this::toDomain).toList();
    }

    private PriceChangeRecord toDomain(PriceChangeJpaEntity e) {
        List<Integer> ids = e.getRuleIds() == null || e.getRuleIds().isBlank() ? List.of()
                : Arrays.stream(e.getRuleIds().split(",")).map(String::trim).map(Integer::valueOf).toList();
        return new PriceChangeRecord(e.getId(), e.getProductId(), e.getPreviousPrice(), e.getNewPrice(),
                e.getChangedAt(), e.getCause(), ids, e.getVariable(), e.getVariableValue(),
                e.getChangedBy(), e.getDetail());
    }
}
