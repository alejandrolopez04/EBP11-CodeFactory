package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.ProductSimulation;
import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.RuleDraft;
import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.SimulationRequest;
import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.SimulationResult;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.PriceTraceRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** HU13: la simulación calcula con el motor real pero no guarda precios ni trazas. */
class PriceSimulationServiceTest {
    private ProductRepositoryPort products;
    private RuleRepositoryPort rules;
    private PriceTraceRepositoryPort traces;
    private PriceSimulationService service;

    // Demanda 90% con umbrales 30/70 → nivel ALTO
    private final Product product = new Product(1L, "SKU-1", "Producto 1", ProductStatus.ACTIVE,
            new BigDecimal("100.00"), new BigDecimal("130.00"), new BigDecimal("80.00"), "General",
            new BigDecimal("100.00"), null, 90L, 50L);

    @BeforeEach
    void setUp() {
        products = mock(ProductRepositoryPort.class);
        rules = mock(RuleRepositoryPort.class);
        traces = mock(PriceTraceRepositoryPort.class);
        BusinessVariableRepositoryPort variables = mock(BusinessVariableRepositoryPort.class);

        when(products.getProductById(1L)).thenReturn(Optional.of(product));
        when(rules.getRules()).thenReturn(List.of());
        when(variables.getAllVariables()).thenReturn(List.of(
                new DemandVariable(1L, VariableType.DEMANDA, LocalDateTime.now(), 30L, 70L)));

        PricingEngineService engine = new PricingEngineService(products, rules, variables, traces);
        service = new PriceSimulationService(engine, products, rules);
    }

    private RuleDraft demandRule(String percent) {
        return new RuleDraft(VariableType.DEMANDA, VariableLevel.ALTO, null, EffectType.PORCENTAJE, new BigDecimal(percent));
    }

    @Test
    void simulaUnaReglaNuevaSinModificarPrecioNiHistorial() {
        SimulationResult result = service.simulate(new SimulationRequest(null, demandRule("20"), List.of(1L)));

        ProductSimulation p = result.products().get(0);
        assertTrue(result.simulation());
        assertTrue(p.ruleApplied());
        assertEquals(0, new BigDecimal("120.00").compareTo(p.simulatedPrice()));
        assertEquals(0, new BigDecimal("100.00").compareTo(p.currentPrice()));
        assertFalse(p.clampedToMax());

        // Nada se persiste: ni el precio del producto ni registros en el historial
        verify(products, never()).updateCurrentPrice(any(), any(), any());
        verify(products, never()).save(any());
        verifyNoInteractions(traces);
        verify(rules, never()).save(any());
    }

    @Test
    void acotaAlMaximoYSenalaQueLaReglaFueLimitada() {
        ProductSimulation p = service.simulate(new SimulationRequest(null, demandRule("50"), List.of(1L)))
                .products().get(0);

        assertTrue(p.clampedToMax());
        assertEquals(0, new BigDecimal("150.00").compareTo(p.calculatedPrice()));
        assertEquals(0, new BigDecimal("130.00").compareTo(p.simulatedPrice()));
    }

    @Test
    void indicaCuandoLaCondicionNoSeCumple() {
        RuleDraft lowDemand = new RuleDraft(VariableType.DEMANDA, VariableLevel.BAJO, null,
                EffectType.PORCENTAJE, new BigDecimal("-10"));
        ProductSimulation p = service.simulate(new SimulationRequest(null, lowDemand, List.of(1L))).products().get(0);

        assertFalse(p.ruleApplied());
        assertEquals(0, new BigDecimal("100.00").compareTo(p.simulatedPrice()));
    }

    @Test
    void rechazaDatosIncompletos() {
        assertThrows(IllegalArgumentException.class,
                () -> service.simulate(new SimulationRequest(null, null, List.of(1L))));
        assertThrows(IllegalArgumentException.class,
                () -> service.simulate(new SimulationRequest(null, demandRule("20"), List.of())));
        verifyNoInteractions(traces);
    }
}
