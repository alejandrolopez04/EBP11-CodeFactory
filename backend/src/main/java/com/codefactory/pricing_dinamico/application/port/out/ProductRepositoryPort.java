package com.codefactory.pricing_dinamico.application.port.out;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepositoryPort {
    Product save(Product product);

    List<Product> getAllProducts();

    List<Product> findByFilters(ProductStatus status, String category);

    Optional<Product> getProductById(Long id);

    boolean existsBySku(String sku);

    void activateProduct(Long id);

    void deactivateProduct(Long id);
}
