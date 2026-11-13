package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.User;

import java.time.Instant;
import java.util.Optional;

public interface AccessTokenPort {
    record IssuedToken(String token, Instant expiresAt) {}

    IssuedToken issue(User user);

    /** Usuario del token si la firma y la vigencia son válidas. */
    Optional<User> verify(String token);
}
