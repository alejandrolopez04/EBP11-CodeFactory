package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.domain.model.events.PricingInputsChangedEvent;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class PricingRecalculationListener {

    private final PricingEngineService engine;

    public PricingRecalculationListener(PricingEngineService engine) {
        this.engine = engine;
    }

    @Async
    @TransactionalEventListener(fallbackExecution = true)
    public void onInputsChanged(PricingInputsChangedEvent event) {
        if (event.productIds().isEmpty()) {
            engine.recalculateAll(event.type(), event.reason());
        } else {
            event.productIds().forEach(id -> engine.recalculate(id, event.type(), event.reason()));
        }
    }
}
