package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_calculation_traces")
public class PriceTraceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    private BigDecimal basePrice;
    private BigDecimal previousPrice;
    private BigDecimal calculatedPrice;
    private BigDecimal finalPrice;
    private boolean clampedToMax;
    private boolean clampedToMin;

    @Column(length = 500)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TriggerType triggerType;

    private String triggerDetail;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private LocalDateTime calculatedAt;

    public PriceTraceJpaEntity() {}

    public PriceTraceJpaEntity(Long productId, BigDecimal basePrice, BigDecimal previousPrice,
                               BigDecimal calculatedPrice, BigDecimal finalPrice,
                               boolean clampedToMax, boolean clampedToMin, String summary,
                               TriggerType triggerType, String triggerDetail,
                               String payload, LocalDateTime calculatedAt) {
        this.productId = productId;
        this.basePrice = basePrice;
        this.previousPrice = previousPrice;
        this.calculatedPrice = calculatedPrice;
        this.finalPrice = finalPrice;
        this.clampedToMax = clampedToMax;
        this.clampedToMin = clampedToMin;
        this.summary = summary;
        this.triggerType = triggerType;
        this.triggerDetail = triggerDetail;
        this.payload = payload;
        this.calculatedAt = calculatedAt;
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public BigDecimal getPreviousPrice() { return previousPrice; }
    public BigDecimal getFinalPrice() { return finalPrice; }
    public boolean isClampedToMax() { return clampedToMax; }
    public boolean isClampedToMin() { return clampedToMin; }
    public String getSummary() { return summary; }
    public TriggerType getTriggerType() { return triggerType; }
    public String getTriggerDetail() { return triggerDetail; }
    public String getPayload() { return payload; }
    public LocalDateTime getCalculatedAt() { return calculatedAt; }
}