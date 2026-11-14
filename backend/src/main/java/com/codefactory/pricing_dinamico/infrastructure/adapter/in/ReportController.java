package com.codefactory.pricing_dinamico.infrastructure.adapter.in;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceComparisonUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetPriceComparisonUseCase.PriceComparison;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final GetPriceComparisonUseCase getPriceComparisonUseCase;

    public ReportController(GetPriceComparisonUseCase getPriceComparisonUseCase) {
        this.getPriceComparisonUseCase = getPriceComparisonUseCase;
    }

    // HU18: GET /api/reports/price-comparison?productIds=1,2&days=30
    @GetMapping("/price-comparison")
    public PriceComparison comparePrices(@RequestParam(required = false) List<Long> productIds,
                                         @RequestParam(required = false) Integer days) {
        return getPriceComparisonUseCase.compare(productIds, days);
    }
}