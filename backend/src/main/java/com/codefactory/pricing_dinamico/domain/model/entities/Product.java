package com.codefactory.pricing_dinamico.domain.model.entities;

public class Product {
    private Long id;
    private String sku;
    private String name;
    private String category;
    private Long basePrice;
    private Long minPrice;
    private Long maxPrice;
    private ProductStatus productStatus;

    public Product() {
    }

    public Product(Long id, String sku, String name, ProductStatus productStatus, Long basePrice, Long maxPrice, Long minPrice, String category) {
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

    public Long getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(Long basePrice) {
        this.basePrice = basePrice;
    }

    public ProductStatus getProductStatus() {
        return productStatus;
    }

    public void setProductStatus(ProductStatus productStatus) {
        this.productStatus = productStatus;
    }

    public Long getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(Long minPrice) {
        this.minPrice = minPrice;
    }

    public Long getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(Long maxPrice) {
        this.maxPrice = maxPrice;
    }
}
