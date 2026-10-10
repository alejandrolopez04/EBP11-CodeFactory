package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.ChangeProductStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.in.CreateProductUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetAllProductsUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:8443")
public class ProductController {
    private final CreateProductUseCase createProductUseCase;
    private final GetAllProductsUseCase getAllProductsUseCase;
    private final ChangeProductStatusUseCase changeProductStatusUseCase;

    ProductController(CreateProductUseCase createProductUseCase,
                      GetAllProductsUseCase getAllProductsUseCase,
                      ChangeProductStatusUseCase changeProductStatusUseCase){
        this.createProductUseCase = createProductUseCase;
        this.getAllProductsUseCase = getAllProductsUseCase;
        this.changeProductStatusUseCase = changeProductStatusUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@RequestBody Product product){
        return createProductUseCase.createProduct(product);
    }

    
    @GetMapping
    public List<Product> getProducts(@RequestParam(required = false) ProductStatus status,
                                     @RequestParam(required = false) String category) {
        return getAllProductsUseCase.getProducts(status, category);
    }

    // HU03
    @PatchMapping("/{id}/deactivate")
    public Product deactivateProduct(@PathVariable Long id) {
        return changeProductStatusUseCase.deactivateProduct(id);
    }

    @PatchMapping("/{id}/activate")
    public Product activateProduct(@PathVariable Long id) {
        return changeProductStatusUseCase.activateProduct(id);
    }
}
