package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PriceCalculationResult {
    private Long productId;
    private BigDecimal basePrice;
    private BigDecimal finalPrice;
    private boolean clampedToMax;
    private boolean clampedToMin;
    private List<Integer> appliedRuleIds;
    private LocalDateTime calculatedAt;

    public PriceCalculationResult() {}

    public PriceCalculationResult(Long productId, BigDecimal basePrice, BigDecimal finalPrice,
                                   boolean clampedToMax, boolean clampedToMin,
                                   List<Integer> appliedRuleIds, LocalDateTime calculatedAt) {
        this.productId = productId;
        this.basePrice = basePrice;
        this.finalPrice = finalPrice;
        this.clampedToMax = clampedToMax;
        this.clampedToMin = clampedToMin;
        this.appliedRuleIds = appliedRuleIds;
        this.calculatedAt = calculatedAt;
    }

    public Long getProductId() { return productId; }
    public BigDecimal getBasePrice() { return basePrice; }
    public BigDecimal getFinalPrice() { return finalPrice; }
    public boolean isClampedToMax() { return clampedToMax; }
    public boolean isClampedToMin() { return clampedToMin; }
    public List<Integer> getAppliedRuleIds() { return appliedRuleIds; }
    public LocalDateTime getCalculatedAt() { return calculatedAt; }
}
