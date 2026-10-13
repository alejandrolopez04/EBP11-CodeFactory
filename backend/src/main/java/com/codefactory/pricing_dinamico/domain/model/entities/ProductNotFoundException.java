package com.codefactory.pricing_dinamico.domain.model.entities;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Producto no encontrado con id: " + id);
    }
}
