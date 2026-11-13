package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.AuthenticationUseCase;
import com.codefactory.pricing_dinamico.application.port.in.AuthenticationUseCase.AuthResult;
import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import com.codefactory.pricing_dinamico.config.AuthProperties;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.SessionEndedException;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.WebUtils;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;

/**
 * Inicio y cierre de sesión. El access token va en el cuerpo (el frontend lo guarda en memoria)
 * y el refresh token en una cookie HttpOnly limitada a /api/auth.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationUseCase authentication;
    private final AuthorizeOperationUseCase authorization;
    private final AuthProperties.Cookie cookie;
    private final Clock clock;

    public AuthController(AuthenticationUseCase authentication, AuthorizeOperationUseCase authorization,
                          AuthProperties props, Clock clock) {
        this.authentication = authentication;
        this.authorization = authorization;
        this.cookie = props.cookie();
        this.clock = clock;
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record UserResponse(Long id, String fullName, String email, Role role) {
        static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
        }
    }

    /** Duraciones en segundos relativas a la respuesta, para no depender del reloj del navegador. */
    public record AuthResponse(String accessToken, long expiresIn, long idleTimeout,
                               long sessionExpiresIn, UserResponse user) {}

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return withSession(authentication.login(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        return withSession(authentication.refresh(readRefreshToken(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authentication.logout(readRefreshToken(request));
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, clearCookie().toString()).build();
    }

    /** Usuario dueño del access token (pasa por el interceptor como cualquier GET). */
    @GetMapping("/me")
    public UserResponse me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return UserResponse.from(this.authorization.authenticate(BearerTokenExtractor.extract(authorization)));
    }

    /** Sesión terminada: 401 con el motivo y la cookie borrada. */
    @ExceptionHandler(SessionEndedException.class)
    public ResponseEntity<Map<String, String>> handleSessionEnded(SessionEndedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                .body(Map.of("message", ex.getMessage(), "reason", ex.getReason().name()));
    }

    private ResponseEntity<AuthResponse> withSession(AuthResult r) {
        Duration sessionLeft = Duration.between(clock.instant(), r.sessionExpiresAt());
        ResponseCookie refreshCookie = baseCookie(r.refreshToken()).maxAge(sessionLeft).build();
        AuthResponse body = new AuthResponse(
                r.accessToken(),
                Duration.between(clock.instant(), r.accessTokenExpiresAt()).toSeconds(),
                r.idleTimeout().toSeconds(),
                sessionLeft.toSeconds(),
                UserResponse.from(r.user()));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body);
    }

    private String readRefreshToken(HttpServletRequest request) {
        Cookie c = WebUtils.getCookie(request, cookie.name());
        return c == null ? null : c.getValue();
    }

    private ResponseCookie clearCookie() {
        return baseCookie("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(cookie.name(), value)
                .httpOnly(true)
                .secure(cookie.secure())
                .sameSite(cookie.sameSite())
                .path(cookie.path());
    }
}
