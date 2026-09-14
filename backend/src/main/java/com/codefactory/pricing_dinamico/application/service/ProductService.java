package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.CreateProductUseCase;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.stereotype.Service;


@Service
public class ProductService implements CreateProductUseCase {
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

        if(product.getBasePrice() == null || product.getBasePrice() <= 0) {
            throw new IllegalArgumentException("El precio base es obligatorio.");
        }

        if(product.getMaxPrice() == null || product.getMaxPrice() <= 0) {
            throw new IllegalArgumentException("El precio máximo es obligatorio.");
        }

        if(product.getMinPrice() == null || product.getMinPrice() <= 0) {
            throw new IllegalArgumentException("El precio mínimo es obligatorio.");
        }

        if (product.getMaxPrice() <= product.getMinPrice()) {
            throw new IllegalArgumentException("El precio mínimo deber ser menor al precio máximo.");
        }

        if (productRepositoryPort.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("El SKU ya existe.");
        }

        ProductStatus productStatus = ProductStatus.ACTIVE;
        product.setProductStatus(productStatus);

        return productRepositoryPort.save(product);
    };
}
