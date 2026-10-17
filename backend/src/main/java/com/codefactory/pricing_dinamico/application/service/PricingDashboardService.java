package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.GetPricingDashboardUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PricingDashboardService implements GetPricingDashboardUseCase {
    private final PriceTraceRepositoryPort priceTraceRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;
    private final RuleRepositoryPort ruleRepositoryPort;
    private final PriceChangeScheduler scheduler;

    public PricingDashboardService(PriceTraceRepositoryPort priceTraceRepositoryPort,
                                   ProductRepositoryPort productRepositoryPort,
                                   RuleRepositoryPort ruleRepositoryPort,
                                   PriceChangeScheduler scheduler) {
        this.priceTraceRepositoryPort = priceTraceRepositoryPort;
        this.productRepositoryPort = productRepositoryPort;
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.scheduler = scheduler;
    }

    @Override
    public PricingDashboard getDashboard() {
        LocalDateTime startOfDay = PricingRule.currentBusinessTime().toLocalDate().atStartOfDay();
        List<PriceUpdate> today = priceTraceRepositoryPort.findSince(startOfDay).stream()
                .filter(PriceUpdate::priceChanged).toList();

        List<Product> products = productRepositoryPort.getAllProducts();
        Map<Long, String> names = products.stream()
                .collect(Collectors.toMap(Product::getId, Product::getName));

        long increases = today.stream().filter(u -> u.previousPrice() != null
                && u.finalPrice().compareTo(u.previousPrice()) > 0).count();
        long decreases = today.stream().filter(u -> u.previousPrice() != null
                && u.finalPrice().compareTo(u.previousPrice()) < 0).count();

        NextChange next = scheduler.getNextBoundary()
                .map(b -> new NextChange(b.at(), b.description(), b.productIds().size()))
                .orElse(null);

        List<RecentUpdate> recent = priceTraceRepositoryPort.findRecentChanges(10).stream()
                .map(u -> new RecentUpdate(u.traceId(),
                        names.getOrDefault(u.productId(), "Producto " + u.productId()),
                        u.previousPrice(), u.finalPrice(), u.triggerType(), u.triggerDetail(),
                        u.clampedToMax(), u.clampedToMin(), u.calculatedAt()))
                .toList();

        return new PricingDashboard(
                products.stream().filter(p -> p.getProductStatus() == ProductStatus.ACTIVE).count(),
                ruleRepositoryPort.getRules().stream().filter(r -> r.getRuleStatus() == RuleStatus.ACTIVE).count(),
                today.size(),
                today.stream().map(PriceUpdate::productId).distinct().count(),
                increases, decreases, next, recent);
    }
}