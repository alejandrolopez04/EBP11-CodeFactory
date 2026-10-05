package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class TemporalVariable extends BusinessVariable {
    private LocalTime morningStartTime;
    private LocalTime morningEndTime;
    private LocalTime afternoonStartTime;
    private LocalTime afternoonEndTime;
    private List<String> highSeasonMonths;

    public TemporalVariable(Long id, VariableType variableType, LocalDateTime updatedAt, LocalTime morningStartTime,
                            LocalTime morningEndTime, LocalTime afternoonStartTime, LocalTime afternoonEndTime, List<String> highSeasonMonths) {
        super(id, variableType, updatedAt);
        this.morningStartTime = morningStartTime;
        this.morningEndTime = morningEndTime;
        this.afternoonStartTime = afternoonStartTime;
        this.afternoonEndTime = afternoonEndTime;
        this.highSeasonMonths = highSeasonMonths;
    }

    public LocalTime getMorningStartTime() {
        return morningStartTime;
    }

    public void setMorningStartTime(LocalTime morningStartTime) {
        this.morningStartTime = morningStartTime;
    }

    public LocalTime getMorningEndTime() {
        return morningEndTime;
    }

    public void setMorningEndTime(LocalTime morningEndTime) {
        this.morningEndTime = morningEndTime;
    }

    public LocalTime getAfternoonStartTime() {
        return afternoonStartTime;
    }

    public void setAfternoonStartTime(LocalTime afternoonStartTime) {
        this.afternoonStartTime = afternoonStartTime;
    }

    public LocalTime getAfternoonEndTime() {
        return afternoonEndTime;
    }

    public void setAfternoonEndTime(LocalTime afternoonEndTime) {
        this.afternoonEndTime = afternoonEndTime;
    }

    public List<String> getHighSeasonMonths() {
        return highSeasonMonths;
    }

    public void setHighSeasonMonths(List<String> highSeasonMonths) {
        this.highSeasonMonths = highSeasonMonths;
    }
}
