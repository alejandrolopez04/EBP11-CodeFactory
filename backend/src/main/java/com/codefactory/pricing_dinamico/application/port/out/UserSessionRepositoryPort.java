package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.UserSession;

import java.time.Instant;
import java.util.Optional;

public interface UserSessionRepositoryPort {
    UserSession save(UserSession session);

    Optional<UserSession> findByTokenHash(String tokenHash);

    /** Borra las sesiones revocadas o vencidas antes de {@code cutoff}. Devuelve cuántas borró. */
    int deleteEndedBefore(Instant cutoff);
}
