package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, Long> {
    Optional<UserJpaEntity> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<UserJpaEntity> findByActiveTrueOrderByIdAsc();
    Optional<UserJpaEntity> findByAccessToken(String accessToken);
}
