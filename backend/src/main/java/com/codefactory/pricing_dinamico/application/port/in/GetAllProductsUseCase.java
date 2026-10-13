package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import java.util.List;

public interface GetAllProductsUseCase {
    List<Product> getAllProducts();

    List<Product> getProducts(ProductStatus status, String category);
}
