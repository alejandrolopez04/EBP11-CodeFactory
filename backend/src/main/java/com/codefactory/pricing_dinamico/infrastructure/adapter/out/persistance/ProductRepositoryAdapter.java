package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

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
    }

    @Override
    public List<Product> getAllProducts(){
        return productJpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<Product> findByFilters(ProductStatus status, String category){
        List<ProductJpaEntity> result;
        if (status != null && category != null) {
            result = productJpaRepository.findByProductStatusAndCategory(status, category);
        } else if (status != null) {
            result = productJpaRepository.findByProductStatus(status);
        } else if (category != null) {
            result = productJpaRepository.findByCategory(category);
        } else {
            result = productJpaRepository.findAll();
        }
        return result.stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Product> getProductById(Long id){
        return productJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsBySku(String sku) {
        return productJpaRepository.existsBySku(sku);
    }

    private ProductJpaEntity toEntity(Product product){
        return new ProductJpaEntity(product.getId(),
                product.getSku(), product.getName(), product.getProductStatus(), product.getBasePrice(), product.getMaxPrice(), product.getMinPrice(), product.getCategory()
        );
    };

    private Product toDomain(ProductJpaEntity entity){
        return new Product(entity.getId(),
                        entity.getSku(), entity.getName(), entity.getProductStatus(), entity.getBasePrice(), entity.getMaxPrice(),
                        entity.getMinPrice(), entity.getCategory()
                );
    }
}


