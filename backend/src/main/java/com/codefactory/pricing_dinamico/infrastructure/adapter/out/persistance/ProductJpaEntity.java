package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="products")
public class ProductJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String sku;

    private String name;
    private String category;
    private BigDecimal basePrice;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus productStatus;

    private BigDecimal currentPrice;
    private LocalDateTime priceUpdatedAt;

    private Long productDemand;
    private Long productAvailability;

    public ProductJpaEntity() {

    }

    public ProductJpaEntity(Long id , String sku, String name, ProductStatus productStatus, BigDecimal basePrice,
                            BigDecimal maxPrice, BigDecimal minPrice, String category, BigDecimal currentPrice, LocalDateTime priceUpdatedAt, Long productDemand, Long productAvailability) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.basePrice = basePrice;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.productStatus = productStatus;
        this.productDemand = productDemand;
        this.productAvailability = productAvailability;
        this.currentPrice = currentPrice;
        this.priceUpdatedAt = priceUpdatedAt;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public LocalDateTime getPriceUpdatedAt() {
        return priceUpdatedAt;
    }

    public Long getProductAvailability() {
        return productAvailability;
    }

    public Long getProductDemand() {
        return productDemand;
    }

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }


    public BigDecimal getBasePrice() {
        return basePrice;
    }


    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public ProductStatus getProductStatus() {
        return productStatus;
    }
}
