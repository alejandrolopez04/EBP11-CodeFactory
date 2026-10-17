package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.CalculateFinalPriceUseCase;
import com.codefactory.pricing_dinamico.application.service.PricingEngineService;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;
import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:8443")
public class PricingEngineController {

    private final CalculateFinalPriceUseCase calculateFinalPriceUseCase;
    private final PricingEngineService pricingEngineService;

    public PricingEngineController(CalculateFinalPriceUseCase calculateFinalPriceUseCase, PricingEngineService pricingEngineService) {
        this.calculateFinalPriceUseCase = calculateFinalPriceUseCase;
        this.pricingEngineService = pricingEngineService;
    }

    @GetMapping("/{id}/price")
    public ResponseEntity<PriceCalculationResult> calculatePrice(@PathVariable Long id) {
        return ResponseEntity.ok(pricingEngineService.recalculate(id, TriggerType.MANUAL, "Consulta manual"));
    }
}
