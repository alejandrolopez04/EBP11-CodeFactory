package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

public class PricingRule {
    /** Orden de aplicación: prioridad ascendente (1 se aplica primero); sin prioridad al final, desempata por id. */
    public static final Comparator<PricingRule> BY_PRIORITY = Comparator
            .comparing(PricingRule::getPriority, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
            .thenComparing(PricingRule::getId, Comparator.nullsLast(Comparator.<Integer>naturalOrder()));

    /** Zona en la que se interpretan las fechas de vigencia, sin importar la zona del servidor (Maven local o Docker). */
    public static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Bogota");

    private Integer id;
    private VariableType variableType;
    private VariableLevel level;        // nullable, solo aplica si variableType es DEMAND o AVAILABILITY
    private TimeConditionType timeCondition;
    private EffectType effectType;
    private BigDecimal effectValue;
    private List<Integer> productIds;
    private RuleStatus ruleStatus;
    private Integer priority;           // orden de aplicación (1 = primero); null en reglas anteriores a la HU de prioridad
    private LocalDateTime validFrom;    // inicio de vigencia (inclusive); junto con validTo; ambos null = sin vigencia programada
    private LocalDateTime validTo;      // fin de vigencia (exclusivo)

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

    public List<Integer> getProductIds() {
        return productIds;
    }

    public Integer getId() {return this.id;}

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

    public BigDecimal getEffectValue() {return effectValue;}

    public EffectType getEffectType() {return effectType;}

    public Integer getPriority() {return priority;}

    public void setPriority(Integer priority) {this.priority = priority;}

    public LocalDateTime getValidFrom() {return validFrom;}

    public void setValidFrom(LocalDateTime validFrom) {this.validFrom = validFrom;}

    public LocalDateTime getValidTo() {return validTo;}

    public void setValidTo(LocalDateTime validTo) {this.validTo = validTo;}

    /** Hora actual en la zona de negocio, que es contra la que se comparan las vigencias. */
    public static LocalDateTime currentBusinessTime() {
        return LocalDateTime.now(BUSINESS_ZONE);
    }

    /** true si la regla está dentro de su vigencia en ese instante; sin fechas, siempre está vigente. */
    public boolean isInEffectAt(LocalDateTime now) {
        if (validFrom != null && now.isBefore(validFrom)) return false;
        return validTo == null || now.isBefore(validTo);
    }

    /** true si la vigencia ya terminó (la regla no volverá a aplicarse). */
    public boolean hasExpiredAt(LocalDateTime now) {
        return validTo != null && !now.isBefore(validTo);
    }

    public Boolean isListEmpty() {return productIds.isEmpty();}
}
