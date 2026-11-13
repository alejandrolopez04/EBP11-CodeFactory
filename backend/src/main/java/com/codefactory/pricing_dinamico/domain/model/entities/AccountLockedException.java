package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.Instant;

public class AccountLockedException extends RuntimeException {
    private final Instant lockedUntil;

    public AccountLockedException(Instant lockedUntil) {
        super("Demasiados intentos fallidos. Intente de nuevo más tarde.");
        this.lockedUntil = lockedUntil;
    }

    public Instant getLockedUntil() { return lockedUntil; }
}
