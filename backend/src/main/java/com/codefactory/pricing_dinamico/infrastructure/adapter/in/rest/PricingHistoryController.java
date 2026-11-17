package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.RevertPricingHistoryUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricing-history")
public class PricingHistoryController {

    private final RevertPricingHistoryUseCase revertPricingHistoryUseCase;

    public PricingHistoryController(
            RevertPricingHistoryUseCase revertPricingHistoryUseCase
    ) {
        this.revertPricingHistoryUseCase = revertPricingHistoryUseCase;
    }

    @GetMapping("/{productId}")
    public ResponseEntity<List<PricingHistoryVersion>> getHistory(
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(
                revertPricingHistoryUseCase.getHistory(productId)
        );
    }

    @PostMapping("/{traceId}/revert")
    public ResponseEntity<PricingHistoryVersion> revert(
            @PathVariable Long traceId,
            @RequestHeader("X-User-Email") String administratorEmail
    ) {
        return ResponseEntity.ok(
                revertPricingHistoryUseCase.revert(traceId, administratorEmail)
        );
    }
}
