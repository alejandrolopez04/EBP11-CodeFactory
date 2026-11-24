package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.RevertPricingHistoryUseCase;
import com.codefactory.pricing_dinamico.application.port.out.PricingHistoryVersionRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PricingHistoryReversionService implements RevertPricingHistoryUseCase {

    private final PricingHistoryVersionRepositoryPort repository;

    public PricingHistoryReversionService(
            PricingHistoryVersionRepositoryPort repository
    ) {
        this.repository = repository;
    }

    @Override
    public List<PricingHistoryVersion> getHistory(Long productId) {
        return repository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Override
    public PricingHistoryVersion revert(Long traceId, String administratorEmail) {

        if (!isAdmin(administratorEmail)) {
            throw new AccessDeniedException("No cuenta con permisos suficientes");
        }

        PricingHistoryVersion version = repository.findByTraceId(traceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "La versión de historial no existe"
                ));

        PricingHistoryVersion reversion = new PricingHistoryVersion(
                version.getProductId(),
                version.getPrice(),
                "REVERSION",
                traceId,
                administratorEmail,
                version.getAppliedRuleIds()
        );

        return repository.save(reversion);
    }

    private boolean isAdmin(String email) {
        return email != null && email.equalsIgnoreCase("admin@codefactory.com");
    }
}
