package com.codefactory.pricing_dinamico.application.port.in;

/** Prioridad asignada a una regla (1 = se aplica primero). */
public record RulePriority(Integer ruleId, Integer priority) {}
