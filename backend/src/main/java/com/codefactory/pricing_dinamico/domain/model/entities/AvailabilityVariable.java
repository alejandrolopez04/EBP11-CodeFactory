package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.LocalDateTime;

public class AvailabilityVariable extends BusinessVariable {
    private Long availabilityLow;
    private Long availabilityHigh;

    public AvailabilityVariable(Long id, VariableType variableType, LocalDateTime updatedAt, Long availabilityLow, Long availabilityHigh) {
        super(id, variableType, updatedAt);
        this.availabilityLow = availabilityLow;
        this.availabilityHigh = availabilityHigh;
    }

    public Long getAvailabilityLow() {
        return availabilityLow;
    }

    public void setAvailabilityLow(Long availabilityLow) {
        this.availabilityLow = availabilityLow;
    }

    public Long getAvailabilityHigh() {
        return availabilityHigh;
    }

    public void setAvailabilityHigh(Long availabilityHigh) {
        this.availabilityHigh = availabilityHigh;
    }
}
