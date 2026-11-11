package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceHistoryUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetPriceHistoryUseCase.PriceHistory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/products")
public class PriceHistoryController {
    private final GetPriceHistoryUseCase getPriceHistoryUseCase;

    public PriceHistoryController(GetPriceHistoryUseCase getPriceHistoryUseCase) {
        this.getPriceHistoryUseCase = getPriceHistoryUseCase;
    }

    /** HU14: GET /api/products/{id}/price-history?from=2026-10-01&to=2026-10-31 (fechas inclusivas y opcionales) */
    @GetMapping("/{id}/price-history")
    public PriceHistory getPriceHistory(@PathVariable Long id,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return getPriceHistoryUseCase.getPriceHistory(id, from, to);
    }
}
