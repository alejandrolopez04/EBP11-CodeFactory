package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.Duration;
import java.time.Instant;

/**
 * Sesión iniciada con login. El refresh token solo se guarda como hash.
 * - lastActivityAt: última renovación (el frontend solo renueva si el usuario estuvo activo).
 * - expiresAt: límite absoluto; las renovaciones no lo extienden.
 */
public class UserSession {
    private Long id;
    private final Long userId;
    private String tokenHash;
    private final Instant createdAt;
    private Instant lastActivityAt;
    private final Instant expiresAt;
    private Instant revokedAt;

    public UserSession(Long id, Long userId, String tokenHash, Instant createdAt,
                       Instant lastActivityAt, Instant expiresAt, Instant revokedAt) {
        this.id = id; this.userId = userId; this.tokenHash = tokenHash; this.createdAt = createdAt;
        this.lastActivityAt = lastActivityAt; this.expiresAt = expiresAt; this.revokedAt = revokedAt;
    }

    public static UserSession start(Long userId, String tokenHash, Instant now, Duration maxDuration) {
        return new UserSession(null, userId, tokenHash, now, now, now.plus(maxDuration), null);
    }

    public boolean isRevoked() { return revokedAt != null; }

    public boolean isExpired(Instant now) { return !now.isBefore(expiresAt); }

    public boolean isIdle(Instant now, Duration idleTimeout) {
        return now.isAfter(lastActivityAt.plus(idleTimeout));
    }

    /** Rota el refresh token y registra actividad. */
    public void rotate(String newTokenHash, Instant now) {
        this.tokenHash = newTokenHash;
        this.lastActivityAt = now;
    }

    public void revoke(Instant now) {
        if (revokedAt == null) revokedAt = now;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastActivityAt() { return lastActivityAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
}
