package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro de cambio de precio. Inmutable: Hibernate ignora actualizaciones (@Immutable),
 * todas las columnas son no actualizables y cualquier intento de update/remove desde JPA lanza excepción.
 */
@Entity
@Immutable
@Table(name = "price_change_records", indexes = {
        @Index(name = "idx_price_change_product", columnList = "productId"),
        @Index(name = "idx_price_change_changed_at", columnList = "changedAt")
})
public class PriceChangeJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long productId;

    @Column(nullable = false, updatable = false)
    private BigDecimal previousPrice;

    @Column(nullable = false, updatable = false)
    private BigDecimal newPrice;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 30)
    private ChangeCause cause;

    @Column(updatable = false, length = 200)
    private String ruleIds;          // ids separados por coma, p. ej. "3,5"

    @Column(updatable = false, length = 100)
    private String variable;

    @Column(updatable = false, length = 500)
    private String variableValue;

    @Column(updatable = false, length = 100)
    private String changedBy;

    @Column(updatable = false, length = 500)
    private String detail;

    protected PriceChangeJpaEntity() {}

    public PriceChangeJpaEntity(Long productId, BigDecimal previousPrice, BigDecimal newPrice,
                                LocalDateTime changedAt, ChangeCause cause, String ruleIds,
                                String variable, String variableValue, String changedBy, String detail) {
        this.productId = productId;
        this.previousPrice = previousPrice;
        this.newPrice = newPrice;
        this.changedAt = changedAt;
        this.cause = cause;
        this.ruleIds = ruleIds;
        this.variable = variable;
        this.variableValue = variableValue;
        this.changedBy = changedBy;
        this.detail = detail;
    }

    @PreUpdate
    void rejectUpdate() {
        throw new IllegalStateException("Los registros de cambios de precio son inmutables: no se pueden modificar.");
    }

    @PreRemove
    void rejectRemove() {
        throw new IllegalStateException("Los registros de cambios de precio son inmutables: no se pueden eliminar.");
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public BigDecimal getPreviousPrice() { return previousPrice; }
    public BigDecimal getNewPrice() { return newPrice; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public ChangeCause getCause() { return cause; }
    public String getRuleIds() { return ruleIds; }
    public String getVariable() { return variable; }
    public String getVariableValue() { return variableValue; }
    public String getChangedBy() { return changedBy; }
    public String getDetail() { return detail; }
}
