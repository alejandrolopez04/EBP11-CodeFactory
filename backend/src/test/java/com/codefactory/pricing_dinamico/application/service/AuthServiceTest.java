package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.AuthenticationUseCase.AuthResult;
import com.codefactory.pricing_dinamico.domain.model.entities.*;
import com.codefactory.pricing_dinamico.domain.model.entities.SessionEndedException.Reason;
import com.codefactory.pricing_dinamico.infrastructure.adapter.out.security.JwtAccessTokenProvider;
import com.codefactory.pricing_dinamico.support.AuthTestSupport.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static com.codefactory.pricing_dinamico.support.AuthTestSupport.props;
import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {
    private MutableClock clock;
    private InMemoryUsers users;
    private InMemorySessions sessions;
    private AuthService service;
    private User admin;
    private User analista;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-11-13T12:00:00Z"));
        users = new InMemoryUsers();
        sessions = new InMemorySessions();
        FakeHasher hasher = new FakeHasher();
        service = new AuthService(users, sessions, hasher, new JwtAccessTokenProvider(props(), clock), props(), clock);
        admin = users.save(new User(null, "admin@pricing.com", "Admin", Role.ADMIN, true, hasher.hash("secreto-1"), 0, null));
        analista = users.save(new User(null, "analista@pricing.com", "Analista", Role.ANALISTA, true, hasher.hash("secreto-2"), 0, null));
    }

    @Nested
    class Login {
        @Test
        void credencialesCorrectasDevuelvenTokensYGuardanSoloElHash() {
            AuthResult r = service.login("ADMIN@pricing.com ", "secreto-1");

            assertNotNull(r.accessToken());
            assertEquals(clock.instant().plus(Duration.ofMinutes(10)), r.accessTokenExpiresAt());
            assertEquals(clock.instant().plus(Duration.ofHours(8)), r.sessionExpiresAt());
            assertEquals(Duration.ofMinutes(15), r.idleTimeout());
            UserSession stored = sessions.all().iterator().next();
            assertNotEquals(r.refreshToken(), stored.getTokenHash());
            assertEquals(AuthService.sha256(r.refreshToken()), stored.getTokenHash());
        }

        @Test
        void contrasenaIncorrectaYCorreoInexistenteDanElMismoError() {
            assertThrows(InvalidCredentialsException.class, () -> service.login("admin@pricing.com", "mal"));
            assertThrows(InvalidCredentialsException.class, () -> service.login("nadie@pricing.com", "secreto-1"));
            assertEquals(1, users.get(admin.getId()).getFailedLoginAttempts());
        }

        @Test
        void usuarioInactivoOSinContrasenaNoEntra() {
            User u = users.get(analista.getId());
            u.setActive(false);
            users.save(u);
            assertThrows(InvalidCredentialsException.class, () -> service.login("analista@pricing.com", "secreto-2"));
        }

        @Test
        void cincoFallosBloqueanLaCuentaQuinceMinutos() {
            for (int i = 0; i < 4; i++) {
                assertThrows(InvalidCredentialsException.class, () -> service.login("admin@pricing.com", "mal"));
            }
            assertThrows(AccountLockedException.class, () -> service.login("admin@pricing.com", "mal"));
            // bloqueada: ni la contraseña correcta entra
            assertThrows(AccountLockedException.class, () -> service.login("admin@pricing.com", "secreto-1"));

            clock.advance(Duration.ofMinutes(15));
            assertNotNull(service.login("admin@pricing.com", "secreto-1").accessToken());
            assertEquals(0, users.get(admin.getId()).getFailedLoginAttempts());
            assertNull(users.get(admin.getId()).getLockedUntil());
        }
    }

    @Nested
    class Refresh {
        @Test
        void renovarRotaElRefreshTokenYElAnteriorDejaDeServir() {
            AuthResult login = service.login("admin@pricing.com", "secreto-1");
            clock.advance(Duration.ofMinutes(9));

            AuthResult renewed = service.refresh(login.refreshToken());

            assertNotEquals(login.refreshToken(), renewed.refreshToken());
            assertEquals(login.sessionExpiresAt(), renewed.sessionExpiresAt()); // el límite absoluto no se mueve
            assertEquals(Reason.INVALID, reason(() -> service.refresh(login.refreshToken())));
        }

        @Test
        void tras15MinutosSinRenovarLaSesionSeCierraPorInactividad() {
            AuthResult login = service.login("admin@pricing.com", "secreto-1");
            clock.advance(Duration.ofMinutes(16).plusSeconds(1)); // 15 min + 1 min de margen + 1 s

            assertEquals(Reason.IDLE_TIMEOUT, reason(() -> service.refresh(login.refreshToken())));
            assertNotNull(sessions.all().iterator().next().getRevokedAt());
        }

        @Test
        void dentroDelMargenDeInactividadTodaviaRenueva() {
            AuthResult login = service.login("admin@pricing.com", "secreto-1");
            clock.advance(Duration.ofMinutes(15).plusSeconds(30));

            assertNotNull(service.refresh(login.refreshToken()).accessToken());
        }

        @Test
        void conActividadConstanteLaSesionTerminaALas8Horas() {
            AuthResult r = service.login("admin@pricing.com", "secreto-1");
            for (int i = 0; i < 53; i++) { // 53 × 9 min = 7 h 57 min
                clock.advance(Duration.ofMinutes(9));
                r = service.refresh(r.refreshToken());
            }
            clock.advance(Duration.ofMinutes(9));
            String last = r.refreshToken();
            assertEquals(Reason.SESSION_EXPIRED, reason(() -> service.refresh(last)));
        }

        @Test
        void usuarioDesactivadoDuranteLaSesionNoPuedeRenovar() {
            AuthResult login = service.login("analista@pricing.com", "secreto-2");
            User u = users.get(analista.getId());
            u.setActive(false);
            users.save(u);

            assertEquals(Reason.INVALID, reason(() -> service.refresh(login.refreshToken())));
        }

        @Test
        void sinCookieOConTokenDesconocidoEsInvalido() {
            assertEquals(Reason.INVALID, reason(() -> service.refresh(null)));
            assertEquals(Reason.INVALID, reason(() -> service.refresh("no-existe")));
        }
    }

    @Nested
    class Logout {
        @Test
        void cerrarSesionRevocaElRefreshToken() {
            AuthResult login = service.login("admin@pricing.com", "secreto-1");

            service.logout(login.refreshToken());

            assertEquals(Reason.INVALID, reason(() -> service.refresh(login.refreshToken())));
        }

        @Test
        void cerrarSesionEsIdempotente() {
            assertDoesNotThrow(() -> service.logout(null));
            assertDoesNotThrow(() -> service.logout("no-existe"));
        }
    }

    @Nested
    class Authorization {
        @Test
        void elAccessTokenIdentificaUsuarioYRol() {
            AuthResult login = service.login("analista@pricing.com", "secreto-2");

            User u = service.authenticate(login.accessToken());

            assertEquals(analista.getId(), u.getId());
            assertEquals(Role.ANALISTA, u.getRole());
        }

        @Test
        void analistaNoPuedeModificarYAdminSi() {
            String analistaToken = service.login("analista@pricing.com", "secreto-2").accessToken();
            String adminToken = service.login("admin@pricing.com", "secreto-1").accessToken();

            assertThrows(OperationNotAllowedException.class, () -> service.checkCanModify(analistaToken));
            assertDoesNotThrow(() -> service.checkCanModify(adminToken));
        }

        @Test
        void accessTokenVencidoOAusenteExigeIniciarSesion() {
            String token = service.login("admin@pricing.com", "secreto-1").accessToken();
            clock.advance(Duration.ofMinutes(10).plusSeconds(1));

            assertThrows(ProfileRequiredException.class, () -> service.authenticate(token));
            assertThrows(ProfileRequiredException.class, () -> service.authenticate(null));
        }
    }

    private static Reason reason(Runnable call) {
        return assertThrows(SessionEndedException.class, call::run).getReason();
    }
}
