package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.service.AuthService;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import com.codefactory.pricing_dinamico.infrastructure.adapter.out.security.JwtAccessTokenProvider;
import com.codefactory.pricing_dinamico.support.AuthTestSupport.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.handler.MappedInterceptor;

import java.time.Duration;
import java.time.Instant;

import static com.codefactory.pricing_dinamico.support.AuthTestSupport.props;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Flujo HTTP completo con el servicio real, repositorios en memoria y el interceptor de roles. */
class AuthControllerTest {
    private static final String LOGIN_ADMIN = "{\"email\":\"admin@pricing.com\",\"password\":\"secreto-1\"}";
    private static final String LOGIN_ANALISTA = "{\"email\":\"analista@pricing.com\",\"password\":\"secreto-2\"}";

    private MutableClock clock;
    private MockMvc mvc;

    /** Recurso protegido de ejemplo para comprobar el interceptor. */
    @RestController
    static class SampleController {
        @GetMapping("/api/sample") String read() { return "ok"; }
        @PostMapping("/api/sample") String write() { return "ok"; }
    }

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-11-13T12:00:00Z"));
        InMemoryUsers users = new InMemoryUsers();
        FakeHasher hasher = new FakeHasher();
        users.save(new User(null, "admin@pricing.com", "Admin", Role.ADMIN, true, hasher.hash("secreto-1"), 0, null));
        users.save(new User(null, "analista@pricing.com", "Analista", Role.ANALISTA, true, hasher.hash("secreto-2"), 0, null));
        AuthService service = new AuthService(users, new InMemorySessions(), hasher,
                new JwtAccessTokenProvider(props(), clock), props(), clock);

        MappedInterceptor roles = new MappedInterceptor(new String[]{"/api/**"},
                new String[]{"/api/auth/login", "/api/auth/refresh", "/api/auth/logout"},
                new RoleAuthorizationInterceptor(service));
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(service, service, props(), clock), new SampleController())
                .setControllerAdvice(new GlobalExceptionHandler(clock))
                .addInterceptors(roles)
                .build();
    }

    @Test
    void loginDevuelveAccessTokenYCookieHttpOnly() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(emptyString())))
                .andExpect(jsonPath("$.expiresIn").value(600))
                .andExpect(jsonPath("$.idleTimeout").value(900))
                .andExpect(jsonPath("$.sessionExpiresIn").value(28800))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, allOf(
                        startsWith("pricing_refresh="), containsString("HttpOnly"), containsString("Secure"),
                        containsString("SameSite=Lax"), containsString("Path=/api/auth"),
                        containsString("Max-Age=28800"))));
    }

    @Test
    void loginIncorrectoDa401YElBloqueoDa429ConRetryAfter() throws Exception {
        String bad = "{\"email\":\"admin@pricing.com\",\"password\":\"mal\"}";
        for (int i = 0; i < 4; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(bad))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Correo o contraseña incorrectos."));
        }
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string(HttpHeaders.RETRY_AFTER, "900"));
    }

    @Test
    void loginSinCamposDa400() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refreshConCookieRotaLaCookie() throws Exception {
        Cookie first = loginCookie(LOGIN_ADMIN);
        clock.advance(Duration.ofMinutes(9));

        MvcResult r = mvc.perform(post("/api/auth/refresh").cookie(first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(emptyString())))
                .andReturn();
        Cookie second = r.getResponse().getCookie("pricing_refresh");
        assertNotNull(second);
        assertNotEquals(first.getValue(), second.getValue());
    }

    @Test
    void refreshTrasInactividadDa401ConMotivoYBorraLaCookie() throws Exception {
        Cookie cookie = loginCookie(LOGIN_ADMIN);
        clock.advance(Duration.ofMinutes(17));

        mvc.perform(post("/api/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.reason").value("IDLE_TIMEOUT"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));
    }

    @Test
    void refreshSinCookieDa401Invalido() throws Exception {
        mvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.reason").value("INVALID"));
    }

    @Test
    void logoutRevocaYBorraLaCookie() throws Exception {
        Cookie cookie = loginCookie(LOGIN_ADMIN);

        mvc.perform(post("/api/auth/logout").cookie(cookie))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));
        mvc.perform(post("/api/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.reason").value("INVALID"));
    }

    @Test
    void meDevuelveElUsuarioDelToken() throws Exception {
        String token = accessToken(LOGIN_ANALISTA);

        mvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("analista@pricing.com"))
                .andExpect(jsonPath("$.role").value("ANALISTA"));
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void elInterceptorMantieneLosPermisosPorRol() throws Exception {
        String analista = "Bearer " + accessToken(LOGIN_ANALISTA);
        String admin = "Bearer " + accessToken(LOGIN_ADMIN);

        mvc.perform(get("/api/sample")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/sample").header(HttpHeaders.AUTHORIZATION, analista)).andExpect(status().isOk());
        mvc.perform(post("/api/sample").header(HttpHeaders.AUTHORIZATION, analista)).andExpect(status().isForbidden());
        mvc.perform(post("/api/sample").header(HttpHeaders.AUTHORIZATION, admin)).andExpect(status().isOk());

        clock.advance(Duration.ofMinutes(11)); // access token vencido
        mvc.perform(get("/api/sample").header(HttpHeaders.AUTHORIZATION, admin)).andExpect(status().isUnauthorized());
    }

    private Cookie loginCookie(String body) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getCookie("pricing_refresh");
    }

    private String accessToken(String body) throws Exception {
        String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        return json.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
