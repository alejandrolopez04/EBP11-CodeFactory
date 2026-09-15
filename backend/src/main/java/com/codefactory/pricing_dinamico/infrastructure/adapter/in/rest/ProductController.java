package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.CreateProductUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:8443")
public class ProductController {
    private final CreateProductUseCase createProductUseCase;

    ProductController(CreateProductUseCase createProductUseCase){
        this.createProductUseCase = createProductUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@RequestBody Product product){
        return createProductUseCase.createProduct(product);
    }
}
