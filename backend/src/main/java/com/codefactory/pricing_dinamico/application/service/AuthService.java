package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.AuthenticationUseCase;
import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import com.codefactory.pricing_dinamico.application.port.out.AccessTokenPort;
import com.codefactory.pricing_dinamico.application.port.out.PasswordHasherPort;
import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.UserSessionRepositoryPort;
import com.codefactory.pricing_dinamico.config.AuthProperties;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import com.codefactory.pricing_dinamico.domain.model.entities.SessionEndedException.Reason;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Login, renovación y cierre de sesión.
 * - Access token: JWT corto que el interceptor valida sin ir a la base de datos.
 * - Refresh token: valor aleatorio en cookie HttpOnly; en la tabla solo se guarda su SHA-256.
 * - Inactividad: el frontend solo renueva si hubo actividad, así que una sesión sin renovar
 *   durante {@code idleTimeout} se considera inactiva y el backend se niega a renovarla.
 */
@Service
public class AuthService implements AuthenticationUseCase, AuthorizeOperationUseCase {
    /** Margen para latencia y diferencias de reloj entre el temporizador del navegador y el servidor. */
    static final Duration IDLE_GRACE = Duration.ofMinutes(1);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepositoryPort users;
    private final UserSessionRepositoryPort sessions;
    private final PasswordHasherPort hasher;
    private final AccessTokenPort tokens;
    private final AuthProperties props;
    private final Clock clock;
    /** Se compara contra él cuando el correo no existe, para que la respuesta tarde lo mismo. */
    private final String dummyHash;

    public AuthService(UserRepositoryPort users, UserSessionRepositoryPort sessions, PasswordHasherPort hasher,
                       AccessTokenPort tokens, AuthProperties props, Clock clock) {
        this.users = users;
        this.sessions = sessions;
        this.hasher = hasher;
        this.tokens = tokens;
        this.props = props;
        this.clock = clock;
        this.dummyHash = hasher.hash("timing-dummy-" + RANDOM.nextLong());
    }

    @Override
    @Transactional(noRollbackFor = {InvalidCredentialsException.class, AccountLockedException.class})
    public AuthResult login(String email, String password) {
        Instant now = clock.instant();
        User user = email == null ? null : users.findByEmail(email.trim()).orElse(null);

        if (user == null || !user.isActive() || user.getPasswordHash() == null) {
            hasher.matches(password, dummyHash);
            throw new InvalidCredentialsException();
        }
        if (user.isLocked(now)) {
            throw new AccountLockedException(user.getLockedUntil());
        }
        if (!hasher.matches(password, user.getPasswordHash())) {
            user.registerFailedLogin(now, props.maxFailedAttempts(), props.lockoutDuration());
            users.save(user);
            if (user.isLocked(now)) throw new AccountLockedException(user.getLockedUntil());
            throw new InvalidCredentialsException();
        }
        if (user.resetFailedLogins()) users.save(user);

        String refreshToken = newRefreshToken();
        UserSession session = sessions.save(
                UserSession.start(user.getId(), sha256(refreshToken), now, props.sessionMaxDuration()));
        return result(user, session, refreshToken);
    }

    @Override
    @Transactional(noRollbackFor = SessionEndedException.class)
    public AuthResult refresh(String refreshToken) {
        Instant now = clock.instant();
        UserSession session = findSession(refreshToken);
        if (session.isRevoked()) throw new SessionEndedException(Reason.INVALID);
        if (session.isExpired(now)) throw end(session, now, Reason.SESSION_EXPIRED);
        if (session.isIdle(now, props.idleTimeout().plus(IDLE_GRACE))) throw end(session, now, Reason.IDLE_TIMEOUT);

        User user = users.findById(session.getUserId()).filter(User::isActive).orElse(null);
        if (user == null) throw end(session, now, Reason.INVALID); // desactivado durante la sesión

        String newRefreshToken = newRefreshToken();
        session.rotate(sha256(newRefreshToken), now);
        sessions.save(session);
        return result(user, session, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return; // idempotente
        sessions.findByTokenHash(sha256(refreshToken)).filter(s -> !s.isRevoked()).ifPresent(s -> {
            s.revoke(clock.instant());
            sessions.save(s);
        });
    }

    @Override
    public User authenticate(String token) {
        if (token == null || token.isBlank()) {
            throw new ProfileRequiredException("Debe iniciar sesión para realizar esta acción.");
        }
        return tokens.verify(token.trim())
                .orElseThrow(() -> new ProfileRequiredException("La sesión expiró o el token no es válido."));
    }

    @Override
    public void checkCanModify(String token) {
        User user = authenticate(token);
        if (!user.canModify()) {
            throw new OperationNotAllowedException(
                    "Su perfil (" + user.getRole() + ") no tiene permiso para realizar esta acción.");
        }
    }

    private UserSession findSession(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) throw new SessionEndedException(Reason.INVALID);
        return sessions.findByTokenHash(sha256(refreshToken))
                .orElseThrow(() -> new SessionEndedException(Reason.INVALID));
    }

    private SessionEndedException end(UserSession session, Instant now, Reason reason) {
        session.revoke(now);
        sessions.save(session);
        return new SessionEndedException(reason);
    }

    private AuthResult result(User user, UserSession session, String refreshToken) {
        AccessTokenPort.IssuedToken access = tokens.issue(user);
        return new AuthResult(access.token(), access.expiresAt(), refreshToken,
                session.getExpiresAt(), props.idleTimeout(), user);
    }

    private static String newRefreshToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
