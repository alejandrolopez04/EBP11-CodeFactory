package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.PriceChangeRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** HU reporte de impacto: registro automático e inmutable de cada cambio de precio. */
class PriceChangeRecordingTest {
    private PriceChangeRepositoryPort priceChanges;
    private BusinessVariableRepositoryPort variables;
    private PriceChangeRecorder recorder;

    @BeforeEach
    void setUp() {
        priceChanges = mock(PriceChangeRepositoryPort.class);
        variables = mock(BusinessVariableRepositoryPort.class);
        recorder = new PriceChangeRecorder(priceChanges, variables);
    }

    private PriceCalculationResult result(String previous, String finalPrice, TriggerType type, String detail) {
        PriceCalculationResult r = new PriceCalculationResult(1L, new BigDecimal("100.00"),
                new BigDecimal(finalPrice), new BigDecimal(finalPrice), false, false, List.of(), Map.of(),
                "resumen", LocalDateTime.of(2026, 11, 17, 10, 0));
        r.setPreviousPrice(new BigDecimal(previous));
        r.setTriggerType(type);
        r.setTriggerDetail(detail);
        return r;
    }

    private PriceChangeRecord saved() {
        ArgumentCaptor<PriceChangeRecord> captor = ArgumentCaptor.forClass(PriceChangeRecord.class);
        verify(priceChanges).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void cambioPorReglaRegistraPrecioAnteriorNuevoFechaYRegla() {
        recorder.record(result("100.00", "120.00", TriggerType.REGLA, "Regla 7 creada"));

        PriceChangeRecord r = saved();
        assertEquals(new BigDecimal("100.00"), r.previousPrice());
        assertEquals(new BigDecimal("120.00"), r.newPrice());
        assertEquals(LocalDateTime.of(2026, 11, 17, 10, 0), r.changedAt());
        assertEquals(ChangeCause.REGLA, r.cause());
        assertEquals(List.of(7), r.ruleIds());
    }

    @Test
    void sinCambioDePrecioNoSeRegistraNada() {
        recorder.record(result("120.00", "120.00", TriggerType.REGLA, "Regla 7 actualizada"));

        verify(priceChanges, never()).save(any());
    }

    @Test
    void cambioPorVariableRegistraLaVariableYSuValor() {
        when(variables.getAllVariables()).thenReturn(List.of(
                new DemandVariable(1L, VariableType.DEMANDA, null, 30L, 70L)));

        recorder.record(result("100.00", "120.00", TriggerType.VARIABLES,
                "Variables de negocio actualizadas (DEMANDA)"));

        PriceChangeRecord r = saved();
        assertEquals(ChangeCause.VARIABLE, r.cause());
        assertEquals("DEMANDA", r.variable());
        assertTrue(r.variableValue().contains("30") && r.variableValue().contains("70"), r.variableValue());
    }

    @Test
    void edicionManualDelPrecioBaseRegistraValoresUsuarioYCausa() {
        ProductRepositoryPort productRepo = mock(ProductRepositoryPort.class);
        Product existing = new Product(1L, "SKU-1", "Producto 1", ProductStatus.ACTIVE,
                new BigDecimal("100.00"), new BigDecimal("130.00"), new BigDecimal("80.00"), "General",
                new BigDecimal("100.00"), null, 90L, 50L);
        when(productRepo.getProductById(1L)).thenReturn(Optional.of(existing));
        when(productRepo.existsBySkuAndIdNot("SKU-1", 1L)).thenReturn(false);
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ProductService service = new ProductService(productRepo, mock(RuleRepositoryPort.class),
                mock(ApplicationEventPublisher.class), priceChanges);

        Product changes = new Product(1L, "SKU-1", "Producto 1", ProductStatus.ACTIVE,
                new BigDecimal("110.00"), new BigDecimal("130.00"), new BigDecimal("80.00"), "General",
                null, null, 90L, 50L);
        service.updateProduct(1L, changes);

        PriceChangeRecord r = saved();
        assertEquals(new BigDecimal("100.00"), r.previousPrice());
        assertEquals(new BigDecimal("110.00"), r.newPrice());
        assertEquals("Administrador", r.changedBy());
        assertEquals(ChangeCause.EDICION_MANUAL, r.cause());
        assertEquals("Edición manual", r.detail());
    }

    @Test
    void elRegistroEsInmutable() {
        PriceChangeRecord r = new PriceChangeRecord(null, 1L, new BigDecimal("100"), new BigDecimal("110"),
                LocalDateTime.now(), ChangeCause.REGLA, List.of(7), null, null, "Sistema", "x");

        assertThrows(UnsupportedOperationException.class, () -> r.ruleIds().add(9));
        assertThrows(IllegalArgumentException.class, () -> new PriceChangeRecord(null, 1L,
                new BigDecimal("100"), new BigDecimal("100.00"), LocalDateTime.now(),
                ChangeCause.OTRO, List.of(), null, null, "Sistema", "x"));
    }
}
