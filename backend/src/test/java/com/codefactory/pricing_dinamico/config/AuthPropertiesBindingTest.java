package com.codefactory.pricing_dinamico.config;

import com.codefactory.pricing_dinamico.infrastructure.adapter.out.security.JwtAccessTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/** Lee el application.properties real: valores por defecto y arranque sin JWT_SECRET. */
class AuthPropertiesBindingTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(AuthConfig.class, JwtAccessTokenProvider.class);

    @Test
    void cargaLosValoresPorDefecto() {
        runner.withPropertyValues("JWT_SECRET=una-clave-de-pruebas-suficientemente-larga-123")
                .run(ctx -> {
                    AuthProperties p = ctx.getBean(AuthProperties.class);
                    assertThat(p.accessTokenTtl()).isEqualTo(Duration.ofMinutes(10));
                    assertThat(p.idleTimeout()).isEqualTo(Duration.ofMinutes(15));
                    assertThat(p.sessionMaxDuration()).isEqualTo(Duration.ofHours(8));
                    assertThat(p.maxFailedAttempts()).isEqualTo(5);
                    assertThat(p.lockoutDuration()).isEqualTo(Duration.ofMinutes(15));
                    assertThat(p.cookie().name()).isEqualTo("pricing_refresh");
                    assertThat(p.cookie().secure()).isTrue();
                    assertThat(p.cookie().sameSite()).isEqualTo("Lax");
                    assertThat(p.cookie().path()).isEqualTo("/api/auth");
                    assertThat(ctx).hasSingleBean(JwtAccessTokenProvider.class);
                });
    }

    @Test
    void sinJwtSecretNoArranca() {
        runner.run(ctx -> assertThat(ctx).hasFailed()
                .getFailure().rootCause().hasMessageContaining("JWT_SECRET"));
    }
}
