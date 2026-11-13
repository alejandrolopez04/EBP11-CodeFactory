package com.codefactory.pricing_dinamico.infrastructure.adapter.out.security;

import com.codefactory.pricing_dinamico.application.port.out.AccessTokenPort;
import com.codefactory.pricing_dinamico.config.AuthProperties;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** Access token JWT firmado con HS256. Lleva lo que el interceptor necesita: id, rol y nombre. */
@Component
public class JwtAccessTokenProvider implements AccessTokenPort {
    private static final String ISSUER = "pricing-dinamico";
    private static final int MIN_SECRET_BYTES = 32; // HS256 exige al menos 256 bits

    private final SecretKey key;
    private final Duration ttl;
    private final Clock clock;

    public JwtAccessTokenProvider(AuthProperties props, Clock clock) {
        String secret = props.jwtSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "Configure JWT_SECRET con al menos " + MIN_SECRET_BYTES + " caracteres "
                            + "(por ejemplo: openssl rand -base64 48).");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttl = props.accessTokenTtl();
        this.clock = clock;
    }

    @Override
    public IssuedToken issue(User user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(ttl);
        String token = Jwts.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
        return new IssuedToken(token, expiresAt);
    }

    @Override
    public Optional<User> verify(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        try {
            Claims c = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(ISSUER)
                    .clock(() -> Date.from(clock.instant()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(User.fromClaims(Long.valueOf(c.getSubject()), c.get("email", String.class),
                    c.get("name", String.class), Role.valueOf(c.get("role", String.class))));
        } catch (JwtException | IllegalArgumentException e) { // firma, vigencia o contenido inválidos
            return Optional.empty();
        }
    }
}
