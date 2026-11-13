package com.codefactory.pricing_dinamico.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Parámetros de sesión ({@code app.auth.*} en application.properties).
 *
 * @param jwtSecret          clave HMAC del JWT, mínimo 32 bytes (variable JWT_SECRET)
 * @param accessTokenTtl     vigencia del access token
 * @param idleTimeout        inactividad máxima; el backend rechaza renovar pasado este tiempo
 * @param sessionMaxDuration límite absoluto de una sesión, aunque haya actividad
 * @param maxFailedAttempts  intentos fallidos antes de bloquear la cuenta
 * @param lockoutDuration    duración del bloqueo
 */
@ConfigurationProperties("app.auth")
public record AuthProperties(
        String jwtSecret,
        Duration accessTokenTtl,
        Duration idleTimeout,
        Duration sessionMaxDuration,
        int maxFailedAttempts,
        Duration lockoutDuration,
        Cookie cookie,
        Seed seed) {

    /** Cookie HttpOnly que transporta el refresh token. */
    public record Cookie(String name, boolean secure, String sameSite, String path) {}

    /** Contraseñas iniciales de los usuarios sembrados (variables de entorno). */
    public record Seed(String adminPassword, String analistaPassword) {}
}
