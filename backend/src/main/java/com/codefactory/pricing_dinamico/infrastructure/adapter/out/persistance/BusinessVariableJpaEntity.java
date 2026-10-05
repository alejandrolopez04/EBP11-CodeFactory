package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "business_variables")
public class BusinessVariableJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private VariableType variableType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String payload;

    private LocalDateTime updatedAt;

    public BusinessVariableJpaEntity() {}

    public BusinessVariableJpaEntity(Long id, VariableType variableType, String payload, LocalDateTime updatedAt) {
        this.id = id;
        this.payload = payload;
        this.variableType = variableType;
        this.updatedAt = updatedAt;
    }

    public String getPayload() {
        return payload;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public VariableType getVariableType() { return variableType; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
