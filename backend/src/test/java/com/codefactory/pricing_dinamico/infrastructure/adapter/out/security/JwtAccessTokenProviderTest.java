package com.codefactory.pricing_dinamico.infrastructure.adapter.out.security;

import com.codefactory.pricing_dinamico.config.AuthProperties;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import com.codefactory.pricing_dinamico.support.AuthTestSupport;
import com.codefactory.pricing_dinamico.support.AuthTestSupport.MutableClock;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class JwtAccessTokenProviderTest {
    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-13T12:00:00Z"));
    private final JwtAccessTokenProvider provider = new JwtAccessTokenProvider(AuthTestSupport.props(), clock);
    private final User user = new User(7L, "a@b.com", "Ana", Role.ADMIN, true, "hash", 0, null);

    @Test
    void emiteYVerificaConLosDatosDelUsuario() {
        String token = provider.issue(user).token();

        User parsed = provider.verify(token).orElseThrow();
        assertEquals(7L, parsed.getId());
        assertEquals("a@b.com", parsed.getEmail());
        assertEquals("Ana", parsed.getFullName());
        assertEquals(Role.ADMIN, parsed.getRole());
        assertNull(parsed.getPasswordHash());
    }

    @Test
    void rechazaTokenAlteradoOFirmadoConOtraClave() {
        String token = provider.issue(user).token();
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "x." + parts[2];

        AuthProperties other = new AuthProperties("otra-clave-distinta-con-mas-de-32-bytes!!", Duration.ofMinutes(10),
                Duration.ofMinutes(15), Duration.ofHours(8), 5, Duration.ofMinutes(15), null, null);
        String foreign = new JwtAccessTokenProvider(other, clock).issue(user).token();

        assertTrue(provider.verify(tampered).isEmpty());
        assertTrue(provider.verify(foreign).isEmpty());
        assertTrue(provider.verify("basura").isEmpty());
        assertTrue(provider.verify(null).isEmpty());
    }

    @Test
    void rechazaTokenVencido() {
        String token = provider.issue(user).token();
        clock.advance(Duration.ofMinutes(10).plusSeconds(1));

        assertTrue(provider.verify(token).isEmpty());
    }

    @Test
    void exigeUnSecretoDeAlMenos32Bytes() {
        AuthProperties weak = new AuthProperties("corta", Duration.ofMinutes(10), Duration.ofMinutes(15),
                Duration.ofHours(8), 5, Duration.ofMinutes(15), null, null);

        assertThrows(IllegalStateException.class, () -> new JwtAccessTokenProvider(weak, clock));
    }
}
