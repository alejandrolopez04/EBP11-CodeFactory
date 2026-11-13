package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface UserSessionJpaRepository extends JpaRepository<UserSessionJpaEntity, Long> {
    Optional<UserSessionJpaEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from UserSessionJpaEntity s where s.expiresAt < :cutoff or s.revokedAt < :cutoff")
    int deleteEndedBefore(@Param("cutoff") Instant cutoff);
}
