package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingHistoryVersion;

import java.util.List;

public interface RevertPricingHistoryUseCase {

    List<PricingHistoryVersion> getHistory(Long productId);

    PricingHistoryVersion revert(Long traceId, String administratorEmail);
}
