package com.codefactory.pricing_dinamico.domain.model.entities;
import java.math.BigDecimal;

public class Product {
    private final Long id;
    private final String sku;
    private final String name;
    private final String category;
    private final BigDecimal basePrice;
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;
    private ProductStatus productStatus;

    public Product(Long id, String sku, String name, ProductStatus productStatus, BigDecimal basePrice, BigDecimal maxPrice, BigDecimal minPrice, String category) {
        this.id = id;
        this.productStatus = productStatus;
        this.basePrice = basePrice;
        this.category = category;
        this.name = name;
        this.sku = sku;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
    }

    public Long getId() {return this.id;}

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

    public ProductStatus getProductStatus() {
        return productStatus;
    }

    public void setProductStatus(ProductStatus productStatus) {
        this.productStatus = productStatus;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }
}
