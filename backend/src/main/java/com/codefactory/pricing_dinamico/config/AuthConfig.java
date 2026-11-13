package com.codefactory.pricing_dinamico.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class AuthConfig {

    /** Reloj inyectable: en las pruebas se reemplaza por uno fijo para simular inactividad. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
