package com.codefactory.pricing_dinamico.domain.model.events;

import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;

import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** productIds vacío = afecta a todos los productos. */
public record PricingInputsChangedEvent(Set<Long> productIds, TriggerType type, String reason) {

    public static PricingInputsChangedEvent all(TriggerType type, String reason) {
        return new PricingInputsChangedEvent(Set.of(), type, reason);
    }

    public static PricingInputsChangedEvent forProduct(Long productId, String reason) {
        return new PricingInputsChangedEvent(Set.of(productId), TriggerType.PRODUCTO, reason);
    }

    public static PricingInputsChangedEvent forProducts(Collection<Integer> productIds, String reason) {
        Set<Long> ids = productIds.stream()
                .filter(Objects::nonNull)
                .map(Integer::longValue)
                .collect(Collectors.toSet());
        return new PricingInputsChangedEvent(ids, TriggerType.REGLA, reason);
    }

    public static PricingInputsChangedEvent forRule(PricingRule rule, String reason) {
        return forProducts(rule.getProductIds() == null ? Set.of() : rule.getProductIds(), reason);
    }
}
