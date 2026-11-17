package com.codefactory.pricing_dinamico.domain.model.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pricing_history_version")
public class PricingHistoryVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long traceId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "reverted_from_trace_id")
    private Long revertedFromTraceId;

    @Column(name = "reverted_by")
    private String revertedBy;

    @ElementCollection
    @CollectionTable(
            name = "pricing_history_applied_rules",
            joinColumns = @JoinColumn(name = "trace_id")
    )
    @Column(name = "rule_id")
    private List<Integer> appliedRuleIds = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PricingHistoryVersion() {
    }

    public PricingHistoryVersion(
            Long productId,
            BigDecimal price,
            String eventType,
            Long revertedFromTraceId,
            String revertedBy,
            List<Integer> appliedRuleIds
    ) {
        this.productId = productId;
        this.price = price;
        this.eventType = eventType;
        this.revertedFromTraceId = revertedFromTraceId;
        this.revertedBy = revertedBy;
        this.appliedRuleIds = appliedRuleIds == null ? new ArrayList<>() : new ArrayList<>(appliedRuleIds);
        this.createdAt = LocalDateTime.now();
    }

    public Long getTraceId() {
        return traceId;
    }

    public Long getProductId() {
        return productId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getEventType() {
        return eventType;
    }

    public Long getRevertedFromTraceId() {
        return revertedFromTraceId;
    }

    public String getRevertedBy() {
        return revertedBy;
    }

    public List<Integer> getAppliedRuleIds() {
        return List.copyOf(appliedRuleIds);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
