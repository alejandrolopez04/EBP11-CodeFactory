package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class UserRepositoryAdapter implements UserRepositoryPort {
    private final UserJpaRepository repo;
    public UserRepositoryAdapter(UserJpaRepository repo) { this.repo = repo; }

    @Override public Optional<User> findByEmail(String email) {
        return repo.findByEmailIgnoreCase(email).map(this::toDomain);
    }
    @Override public boolean existsByEmail(String email) { return repo.existsByEmailIgnoreCase(email); }
    @Override public User save(User u) { return toDomain(repo.save(toEntity(u))); }

    private User toDomain(UserJpaEntity e) {
        return new User(e.getId(), e.getEmail(), e.getFullName(), e.getRole(), e.isActive());
    }
    private UserJpaEntity toEntity(User u) {
        return new UserJpaEntity(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isActive());
    }
}