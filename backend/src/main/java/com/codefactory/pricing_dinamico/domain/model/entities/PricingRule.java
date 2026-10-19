package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class PricingRule {
    public static final Comparator<PricingRule> BY_PRIORITY = Comparator
            .comparing(PricingRule::getPriority, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
            .thenComparing(PricingRule::getId, Comparator.nullsLast(Comparator.<Integer>naturalOrder()));

    public static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Bogota");

    private Integer id;
    private VariableType variableType;
    private VariableLevel level;
    private TimeConditionType timeCondition;
    private EffectType effectType;
    private BigDecimal effectValue;
    private List<Integer> productIds;
    private RuleStatus ruleStatus;
    private Integer priority;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;

    public PricingRule() {}

    public PricingRule(Integer id, VariableType variableType, RuleStatus ruleStatus, VariableLevel level, EffectType effectType,
                       BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.ruleStatus = ruleStatus;
        this.effectType = effectType;
        this.level = level;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public PricingRule(Integer id, VariableType variableType, RuleStatus ruleStatus, TimeConditionType timeCondition,
                       EffectType effectType, BigDecimal effectValue, List<Integer> productIds) {
        this.id = id;
        this.variableType = variableType;
        this.timeCondition = timeCondition;
        this.ruleStatus = ruleStatus;
        this.effectType = effectType;
        this.effectValue = effectValue;
        this.productIds = productIds;
    }

    public void updateCondition(VariableType variableType, VariableLevel level, TimeConditionType timeCondition) {
        if (variableType == null) {
            throw new IllegalArgumentException("La variable de negocio es obligatoria.");
        }
        this.variableType = variableType;
        this.level = level;
        this.timeCondition = timeCondition;
    }

    public void updateEffect(EffectType effectType, BigDecimal effectValue) {
        if (effectType == null) {
            throw new IllegalArgumentException("El tipo de efecto es obligatorio.");
        }
        if (effectValue == null || effectValue.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El valor del efecto debe ser mayor o igual a 0.");
        }
        this.effectType = effectType;
        this.effectValue = effectValue;
    }

    public void updateProducts(List<Integer> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            throw new IllegalArgumentException("Seleccione al menos un producto.");
        }
        this.productIds = new ArrayList<>(productIds);
    }

    public void removeProduct(Integer productId) {
        if (productIds != null) {
            productIds = productIds.stream()
                    .filter(existingId -> !existingId.equals(productId))
                    .toList();
        }
    }

    public void updateValidity(LocalDateTime validFrom, LocalDateTime validTo) {
        if ((validFrom == null) != (validTo == null)) {
            throw new IllegalArgumentException("Defina la fecha de inicio y la fecha de fin de la vigencia.");
        }
        if (validFrom != null && !validFrom.isBefore(validTo)) {
            throw new IllegalArgumentException("La fecha de fin debe ser posterior a la fecha de inicio de la vigencia.");
        }
        this.validFrom = validFrom;
        this.validTo = validTo;
    }

    public void activate() {
        this.ruleStatus = RuleStatus.ACTIVE;
    }

    public void deactivate() {
        this.ruleStatus = RuleStatus.INACTIVE;
    }

    public boolean isActive() {
        return this.ruleStatus == RuleStatus.ACTIVE;
    }

    public List<Integer> getProductIds() {
        return productIds;
    }

    public Integer getId() {
        return this.id;
    }

    public void setRuleStatus(RuleStatus ruleStatus) {
        this.ruleStatus = ruleStatus;
    }

    public RuleStatus getRuleStatus() {
        return ruleStatus;
    }

    public VariableType getVariableType() {
        return variableType;
    }

    public VariableLevel getLevel() {
        return level;
    }

    public TimeConditionType getTimeCondition() {
        return timeCondition;
    }

    public BigDecimal getEffectValue() {
        return effectValue;
    }

    public EffectType getEffectType() {
        return effectType;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDateTime getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDateTime validTo) {
        this.validTo = validTo;
    }

    public static LocalDateTime currentBusinessTime() {
        return LocalDateTime.now(BUSINESS_ZONE);
    }

    public boolean isInEffectAt(LocalDateTime now) {
        if (validFrom != null && now.isBefore(validFrom)) return false;
        return validTo == null || now.isBefore(validTo);
    }

    public boolean hasExpiredAt(LocalDateTime now) {
        return validTo != null && !now.isBefore(validTo);
    }

    public Boolean isListEmpty() {
        return productIds == null || productIds.isEmpty();
    }
}
