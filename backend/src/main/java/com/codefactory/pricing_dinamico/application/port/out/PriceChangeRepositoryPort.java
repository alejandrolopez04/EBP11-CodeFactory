package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.ChangeCause;
import com.codefactory.pricing_dinamico.domain.model.entities.PriceChangeRecord;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Almacén append-only: solo permite crear y consultar. No expone actualizar ni eliminar
 * (inmutabilidad por diseño del puerto).
 */
public interface PriceChangeRepositoryPort {
    PriceChangeRecord save(PriceChangeRecord record);

    /** Más recientes primero. Todos los filtros son opcionales (null = sin filtro). */
    List<PriceChangeRecord> find(Long productId, LocalDateTime from, LocalDateTime to, ChangeCause cause);
}
