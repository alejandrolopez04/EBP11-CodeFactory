package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.LocalDateTime;

public class DemandVariable extends BusinessVariable {
    private Long demandLow;
    private Long demandHigh;

    public DemandVariable(Long id, VariableType variableType, LocalDateTime updatedAt, Long demandLow, Long demandHigh) {
        super(id, variableType, updatedAt);
        this.demandLow = demandLow;
        this.demandHigh = demandHigh;
    }

    public Long getDemandLow() {
        return demandLow;
    }

    public void setDemandLow(Long demandLow) {
        this.demandLow = demandLow;
    }

    public Long getDemandHigh() {
        return demandHigh;
    }

    public void setDemandHigh(Long demandHigh) {
        this.demandHigh = demandHigh;
    }
}
