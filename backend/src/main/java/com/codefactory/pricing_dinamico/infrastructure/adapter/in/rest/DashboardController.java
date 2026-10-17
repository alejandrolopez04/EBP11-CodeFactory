package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.GetPricingDashboardUseCase.PricingDashboard;
import com.codefactory.pricing_dinamico.application.port.in.GetPricingDashboardUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final GetPricingDashboardUseCase getPricingDashboardUseCase;

    public DashboardController(GetPricingDashboardUseCase getPricingDashboardUseCase) {
        this.getPricingDashboardUseCase = getPricingDashboardUseCase;
    }

    @GetMapping
    public PricingDashboard getDashboard() {
        return getPricingDashboardUseCase.getDashboard();
    }
}
