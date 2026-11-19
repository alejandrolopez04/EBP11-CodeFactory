package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ChangeProductStatusUseCase;
import com.codefactory.pricing_dinamico.application.port.in.CreateProductUseCase;
import com.codefactory.pricing_dinamico.application.port.in.DeleteProductUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetAllProductsUseCase;
import com.codefactory.pricing_dinamico.application.port.in.UpdateProductUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PriceChangeRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.Product;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductNotFoundException;
import com.codefactory.pricing_dinamico.domain.model.entities.ProductStatus;
import com.codefactory.pricing_dinamico.domain.model.events.PricingInputsChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;


@Service
public class ProductService implements CreateProductUseCase, GetAllProductsUseCase, ChangeProductStatusUseCase, UpdateProductUseCase, DeleteProductUseCase {
    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;
    private final ApplicationEventPublisher events;
    private final PriceChangeRepositoryPort priceChangeRepositoryPort;

    public ProductService(ProductRepositoryPort productRepositoryPort,
                           RuleRepositoryPort ruleRepositoryPort,
                           ApplicationEventPublisher events,
                           PriceChangeRepositoryPort priceChangeRepositoryPort) {
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.events = events;
        this.priceChangeRepositoryPort = priceChangeRepositoryPort;
    }

    @Override
    public Product createProduct(Product product) {
        validateFields(product);
        if (productRepositoryPort.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("El SKU ya se encuentra registrado.");
        }
        product.setProductStatus(ProductStatus.ACTIVE);
        Product saved = productRepositoryPort.save(product);
        events.publishEvent(PricingInputsChangedEvent.forProduct(saved.getId(), "Producto registrado"));
        return saved;
    }


    @Override
    @Transactional
    public Product updateProduct(Long id, Product changes) {
        Product existing = productRepositoryPort.getProductById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        validateFields(changes);

        if (productRepositoryPort.existsBySkuAndIdNot(changes.getSku(), id)) {
            throw new IllegalArgumentException("El SKU ya se encuentra registrado.");
        }

        Product updated = new Product(id, changes.getSku(), changes.getName(),
                existing.getProductStatus(), changes.getBasePrice(),
                changes.getMaxPrice(), changes.getMinPrice(), changes.getCategory(), existing.getCurrentPrice(), existing.getPriceUpdatedAt(), changes.getProductDemand(), changes.getProductAvailability());

        Product saved = productRepositoryPort.save(updated);

        // Reporte de impacto: edición manual del precio base
        if (existing.getBasePrice() != null && changes.getBasePrice().compareTo(existing.getBasePrice()) != 0) {
            priceChangeRepositoryPort.save(new PriceChangeRecord(null, id, existing.getBasePrice(),
                    changes.getBasePrice(), PricingRule.currentBusinessTime(), ChangeCause.EDICION_MANUAL,
                    null, null, null, "Administrador", "Edición manual"));
        }
        events.publishEvent(PricingInputsChangedEvent.forProduct(id, "Producto actualizado"));
        return saved;
    }

    private void validateFields(Product product) {
        if (product.getSku() == null || product.getSku().isBlank())
            throw new IllegalArgumentException("El SKU es obligatorio.");
        if (product.getName() == null || product.getName().isBlank())
            throw new IllegalArgumentException("El nombre es obligatorio.");
        if (product.getCategory() == null || product.getCategory().isBlank())
            throw new IllegalArgumentException("La categoría es obligatoria.");
        if (!isPositive(product.getBasePrice()))
            throw new IllegalArgumentException("El precio base es obligatorio.");
        if (!isPositive(product.getMaxPrice()))
            throw new IllegalArgumentException("El precio máximo es obligatorio.");
        if (!isPositive(product.getMinPrice()))
            throw new IllegalArgumentException("El precio mínimo es obligatorio.");
        if (product.getMinPrice().compareTo(product.getMaxPrice()) >= 0)
            throw new IllegalArgumentException("El precio mínimo debe ser estrictamente menor al precio máximo.");
    }

    private boolean isPositive(BigDecimal value) {
        return value != null && value.signum() > 0;
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

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        productRepositoryPort.getProductById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        List<com.codefactory.pricing_dinamico.domain.model.entities.PricingRule> affectedRules =
                ruleRepositoryPort.getRules().stream()
                        .filter(rule -> rule.getProductIds() != null && rule.getProductIds().contains(id.intValue()))
                        .toList();

        affectedRules.forEach(rule -> rule.removeProduct(id.intValue()));
        if (!affectedRules.isEmpty()) {
            ruleRepositoryPort.saveAll(affectedRules);
        }
        productRepositoryPort.deleteById(id);
    }

    private Product changeStatus(Long id, ProductStatus newStatus) {
        Product product = productRepositoryPort.getProductById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setProductStatus(newStatus);
        Product saved = productRepositoryPort.save(product);
        events.publishEvent(PricingInputsChangedEvent.forProduct(id,
                newStatus == ProductStatus.ACTIVE ? "Producto reactivado" : "Producto desactivado"));
        return saved;
    }
}