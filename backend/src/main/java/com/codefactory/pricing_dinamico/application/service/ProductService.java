package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ChangeProductStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.in.CreateProductUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetAllProductsUseCase;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductNotFoundException;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class ProductService implements CreateProductUseCase, GetAllProductsUseCase, ChangeProductStatusUseCase {
    private final ProductRepositoryPort productRepositoryPort;

    public ProductService(ProductRepositoryPort productRepositoryPort) {
        this.productRepositoryPort = productRepositoryPort;
    }

    @Override
    public Product createProduct(Product product){
        if(product.getSku() == null || product.getSku().isBlank()){
            throw new IllegalArgumentException("El SKU es obligatorio.");
        }

        if(product.getName() == null || product.getName().isBlank()){
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }

        if(product.getCategory() == null || product.getCategory().isBlank()){
            throw new IllegalArgumentException("La categoría es obligatoria.");
        }

        if(product.getBasePrice() == null || product.getBasePrice().intValue() <= 0) {
            throw new IllegalArgumentException("El precio base es obligatorio.");
        }

        if(product.getMaxPrice() == null || product.getMaxPrice().intValue() <= 0) {
            throw new IllegalArgumentException("El precio máximo es obligatorio.");
        }

        if(product.getMinPrice() == null || product.getMinPrice().intValue() <= 0) {
            throw new IllegalArgumentException("El precio mínimo es obligatorio.");
        }

        if (product.getMaxPrice().intValue() <= product.getMinPrice().intValue()) {
            throw new IllegalArgumentException("El precio mínimo deber ser menor al precio máximo.");
        }

        if (productRepositoryPort.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("El SKU ya se encuentra registrado.");
        }

        ProductStatus productStatus = ProductStatus.ACTIVE;
        product.setProductStatus(productStatus);

        return productRepositoryPort.save(product);
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepositoryPort.getAllProducts();
    }

    
    @Override
    public List<Product> getProducts(ProductStatus status, String category) {
        String normalizedCategory = (category == null || category.isBlank()) ? null : category.trim();
        return productRepositoryPort.findByFilters(status, normalizedCategory);
    }

    // HU03: solo cambia el estado.
    @Override
    public Product deactivateProduct(Long id) {
        return changeStatus(id, ProductStatus.INACTIVE);
    }

    @Override
    public Product activateProduct(Long id) {
        return changeStatus(id, ProductStatus.ACTIVE);
    }

    private Product changeStatus(Long id, ProductStatus newStatus) {
        Product product = productRepositoryPort.getProductById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setProductStatus(newStatus);
        return productRepositoryPort.save(product);
    }
}