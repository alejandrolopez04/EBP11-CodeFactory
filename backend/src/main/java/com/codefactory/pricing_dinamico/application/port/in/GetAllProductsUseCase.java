package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import java.util.List;

public interface GetAllProductsUseCase {
    List<Product> getAllProducts();
}
