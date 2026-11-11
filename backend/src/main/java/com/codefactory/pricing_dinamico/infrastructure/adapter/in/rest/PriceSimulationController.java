package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase;
import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.SimulationRequest;
import com.codefactory.pricing_dinamico.application.port.in.SimulatePriceUseCase.SimulationResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulations")
public class PriceSimulationController {
    private final SimulatePriceUseCase simulatePriceUseCase;

    public PriceSimulationController(SimulatePriceUseCase simulatePriceUseCase) {
        this.simulatePriceUseCase = simulatePriceUseCase;
    }

    /** HU13: POST /api/simulations — solo administradores (el interceptor exige ADMIN para POST). No guarda nada. */
    @PostMapping
    public SimulationResult simulate(@RequestBody SimulationRequest request) {
        return simulatePriceUseCase.simulate(request);
    }
}
