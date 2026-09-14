package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import jakarta.persistence.*;

import javax.annotation.processing.Generated;

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
    private Long basePrice;
    private Long minPrice;
    private Long maxPrice;
    private ProductStatus productStatus;

    public ProductJpaEntity() {

    }

    public ProductJpaEntity(Long id ,String sku, String name, ProductStatus productStatus, Long basePrice, Long minPrice, Long maxPrice, String category) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.basePrice = basePrice;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.productStatus = productStatus;
    }

    public Long getId() {
        return id;
    }

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

    public ProductStatus getProductStatus() {
        return productStatus;
    }

    public void setProductStatus(ProductStatus productStatus) {
        this.productStatus = productStatus;
    }
}
