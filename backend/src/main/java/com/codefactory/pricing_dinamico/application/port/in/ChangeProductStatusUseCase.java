package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.Product;

public interface ChangeProductStatusUseCase {
    Product deactivateProduct(Long id);

    Product activateProduct(Long id);
}
