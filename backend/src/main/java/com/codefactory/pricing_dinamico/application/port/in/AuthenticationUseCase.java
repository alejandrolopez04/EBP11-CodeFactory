package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.User;

import java.time.Duration;
import java.time.Instant;

public interface AuthenticationUseCase {

    /**
     * Resultado de login o renovación. El refresh token va en claro solo aquí,
     * para que la capa web lo ponga en la cookie; en la base de datos se guarda su hash.
     */
    record AuthResult(String accessToken, Instant accessTokenExpiresAt, String refreshToken,
                      Instant sessionExpiresAt, Duration idleTimeout, User user) {}

    AuthResult login(String email, String password);

    AuthResult refresh(String refreshToken);

    void logout(String refreshToken);
}
