package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_session_token_hash", columnList = "tokenHash", unique = true),
        @Index(name = "idx_session_user", columnList = "userId")
})
public class UserSessionJpaEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long userId;
    /** SHA-256 del refresh token en Base64URL (43 caracteres). */
    @Column(nullable = false, length = 64)
    private String tokenHash;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant lastActivityAt;
    @Column(nullable = false)
    private Instant expiresAt;
    private Instant revokedAt;

    public UserSessionJpaEntity() {}

    public UserSessionJpaEntity(Long id, Long userId, String tokenHash, Instant createdAt,
                                Instant lastActivityAt, Instant expiresAt, Instant revokedAt) {
        this.id = id;
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.createdAt = createdAt;
        this.lastActivityAt = lastActivityAt;
        this.expiresAt = expiresAt;
        this.revokedAt = revokedAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastActivityAt() { return lastActivityAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
}
