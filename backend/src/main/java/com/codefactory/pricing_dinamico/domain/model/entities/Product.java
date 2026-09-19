package com.codefactory.pricing_dinamico.domain.model.entities;

import javax.swing.*;
import java.math.BigDecimal;

public class Product {
    private Long id;
    private String sku;
    private String name;
    private String category;
    private BigDecimal basePrice;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private ProductStatus productStatus;

    public Product() {
    }

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

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
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

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }
}
