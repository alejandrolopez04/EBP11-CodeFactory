package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.GetPriceImpactReportUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetPriceImpactReportUseCase.PriceImpactReport;
import com.codefactory.pricing_dinamico.application.port.in.GetPriceImpactReportUseCase.ReportFilter;
import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Consulta de cambios de precio y reporte de impacto. Los registros son de solo lectura:
 * cualquier intento de crear, modificar o eliminar por la API se rechaza con 405.
 */
@RestController
@RequestMapping("/api/price-changes")
public class PriceChangeController {

    private final GetPriceImpactReportUseCase reportUseCase;

    public PriceChangeController(GetPriceImpactReportUseCase reportUseCase) {
        this.reportUseCase = reportUseCase;
    }

    @GetMapping
    public List<PriceChangeRecord> list(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) ChangeCause cause) {
        return reportUseCase.getChanges(new ReportFilter(productId, from, to, cause));
    }

    @GetMapping("/report")
    public PriceImpactReport report(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) ChangeCause cause) {
        return reportUseCase.getReport(new ReportFilter(productId, from, to, cause));
    }

    @RequestMapping(value = {"", "/{id}", "/report"},
            method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE})
    public ResponseEntity<Map<String, String>> rejectModification() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .header(HttpHeaders.ALLOW, "GET")
                .body(Map.of("message",
                        "Los registros de cambios de precio son inmutables: no se pueden crear, modificar ni eliminar manualmente."));
    }
}
