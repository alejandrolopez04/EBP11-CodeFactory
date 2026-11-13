package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.UserSessionRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.UserSession;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Component
public class UserSessionRepositoryAdapter implements UserSessionRepositoryPort {
    private final UserSessionJpaRepository repo;

    public UserSessionRepositoryAdapter(UserSessionJpaRepository repo) { this.repo = repo; }

    @Override
    public UserSession save(UserSession s) {
        return toDomain(repo.save(new UserSessionJpaEntity(s.getId(), s.getUserId(), s.getTokenHash(),
                s.getCreatedAt(), s.getLastActivityAt(), s.getExpiresAt(), s.getRevokedAt())));
    }

    @Override
    public Optional<UserSession> findByTokenHash(String tokenHash) {
        return repo.findByTokenHash(tokenHash).map(this::toDomain);
    }

    @Override
    @Transactional
    public int deleteEndedBefore(Instant cutoff) {
        return repo.deleteEndedBefore(cutoff);
    }

    private UserSession toDomain(UserSessionJpaEntity e) {
        return new UserSession(e.getId(), e.getUserId(), e.getTokenHash(), e.getCreatedAt(),
                e.getLastActivityAt(), e.getExpiresAt(), e.getRevokedAt());
    }
}
