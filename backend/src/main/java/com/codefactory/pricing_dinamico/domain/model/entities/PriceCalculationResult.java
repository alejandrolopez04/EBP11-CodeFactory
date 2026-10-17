package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class PriceCalculationResult {
    private Long traceId;
    private Long productId;
    private BigDecimal basePrice;
    private BigDecimal previousPrice;
    private BigDecimal calculatedPrice;
    private BigDecimal finalPrice;
    private boolean clampedToMax;
    private boolean clampedToMin;
    private List<Integer> appliedRuleIds;
    private List<AppliedRuleStep> steps;
    private Map<String, String> evaluatedVariables;
    private String summary;
    private TriggerType triggerType;
    private String triggerDetail;
    private LocalDateTime calculatedAt;

    public PriceCalculationResult() {}

    public PriceCalculationResult(Long productId, BigDecimal basePrice, BigDecimal calculatedPrice,
                                  BigDecimal finalPrice, boolean clampedToMax, boolean clampedToMin,
                                  List<AppliedRuleStep> steps, Map<String, String> evaluatedVariables,
                                  String summary, LocalDateTime calculatedAt) {
        this.productId = productId;
        this.basePrice = basePrice;
        this.calculatedPrice = calculatedPrice;
        this.finalPrice = finalPrice;
        this.clampedToMax = clampedToMax;
        this.clampedToMin = clampedToMin;
        this.steps = steps;
        this.appliedRuleIds = steps.stream().map(AppliedRuleStep::ruleId).toList();
        this.evaluatedVariables = evaluatedVariables;
        this.summary = summary;
        this.calculatedAt = calculatedAt;
    }

    public Long getTraceId() { return traceId; }
    public void setTraceId(Long traceId) { this.traceId = traceId; }
    public Long getProductId() { return productId; }
    public BigDecimal getBasePrice() { return basePrice; }
    public BigDecimal getPreviousPrice() { return previousPrice; }
    public void setPreviousPrice(BigDecimal previousPrice) { this.previousPrice = previousPrice; }
    public BigDecimal getCalculatedPrice() { return calculatedPrice; }
    public BigDecimal getFinalPrice() { return finalPrice; }
    public boolean isClampedToMax() { return clampedToMax; }
    public boolean isClampedToMin() { return clampedToMin; }
    public List<Integer> getAppliedRuleIds() { return appliedRuleIds; }
    public List<AppliedRuleStep> getSteps() { return steps; }
    public Map<String, String> getEvaluatedVariables() { return evaluatedVariables; }
    public String getSummary() { return summary; }
    public TriggerType getTriggerType() { return triggerType; }
    public void setTriggerType(TriggerType triggerType) { this.triggerType = triggerType; }
    public String getTriggerDetail() { return triggerDetail; }
    public void setTriggerDetail(String triggerDetail) { this.triggerDetail = triggerDetail; }
    public LocalDateTime getCalculatedAt() { return calculatedAt; }
}