package com.codefactory.pricing_dinamico.domain.model.entities;

/** Origen de un cambio de precio registrado en el reporte de impacto. */
public enum ChangeCause {
    REGLA,
    VARIABLE,
    EDICION_MANUAL,
    PRODUCTO,
    HORARIO,
    OTRO
}
