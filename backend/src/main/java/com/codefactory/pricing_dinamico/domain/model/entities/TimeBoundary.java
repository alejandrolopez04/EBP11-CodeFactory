package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.LocalDateTime;
import java.util.Set;

public record TimeBoundary(LocalDateTime at, String description, Set<Long> productIds) {}
