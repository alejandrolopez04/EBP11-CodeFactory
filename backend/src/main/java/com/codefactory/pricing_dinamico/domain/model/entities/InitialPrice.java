package com.codefactory.pricing_dinamico.domain.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * HU14: primera traza de cálculo del producto.
 * basePrice es el precio base con el que se registró; price, el precio final que calculó el motor en ese momento.
 */
public record InitialPrice(BigDecimal basePrice, BigDecimal price, LocalDateTime at) {
}
