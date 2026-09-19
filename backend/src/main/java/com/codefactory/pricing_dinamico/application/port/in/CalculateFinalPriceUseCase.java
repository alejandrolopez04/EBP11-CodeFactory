package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.PriceCalculationResult;

public interface CalculateFinalPriceUseCase {
    PriceCalculationResult calculateFinalPrice(Long productId);
}
