package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

@Component
public class ProductRepositoryAdapter implements ProductRepositoryPort {
    private final ProductJpaRepository productJpaRepository;

    public ProductRepositoryAdapter(ProductJpaRepository productJpaRepository){
        this.productJpaRepository = productJpaRepository;
    }

    @Override
    public Product save(Product product){
        ProductJpaEntity entity = toEntity(product);
        ProductJpaEntity saved = productJpaRepository.save(entity);
        return toDomain(saved);
    };

    @Override
    public List<Product> getProducts(){
        return productJpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Product> getProductById(Long id){
        return productJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsBySku(String sku) {
        return productJpaRepository.existsBySku(sku);
    }

    @Override
    public void deactivateProduct(Long id){
        Product productToDeactivate = productJpaRepository.findById(id).map(this::toDomain).get();
        ProductStatus productStatus = ProductStatus.INACTIVE;
        productToDeactivate.setProductStatus(productStatus);
    };

    @Override
    public void activateProduct(Long id){
        Product productToDeactivate = productJpaRepository.findById(id).map(this::toDomain).get();
        ProductStatus productStatus = ProductStatus.ACTIVE;
        productToDeactivate.setProductStatus(productStatus);
    };

    private ProductJpaEntity toEntity(Product product){
        return new ProductJpaEntity(product.getId(),
                product.getSku(), product.getName(), product.getProductStatus(), product.getBasePrice(), product.getMinPrice(), product.getMaxPrice(), product.getCategory()
        );
    };

    private Product toDomain(ProductJpaEntity entity){
        return new Product(entity.getId(),
                        entity.getSku(), entity.getName(), entity.getProductStatus(), entity.getBasePrice(), entity.getMinPrice(),
                        entity.getMaxPrice(), entity.getCategory()
                );
    }






}
