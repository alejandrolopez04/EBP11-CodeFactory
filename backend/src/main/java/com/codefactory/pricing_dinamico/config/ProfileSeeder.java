package com.codefactory.pricing_dinamico.config;

import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

@Component
public class ProfileSeeder implements CommandLineRunner {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepositoryPort userRepositoryPort;

    public ProfileSeeder(UserRepositoryPort userRepositoryPort) {
        this.userRepositoryPort = userRepositoryPort;
    }

    @Override
    public void run(String... args) {
        upsert("admin@pricing.com", "Diego Candamil", Role.ADMIN);
        upsert("analista@pricing.com", "Alejandro Lopez", Role.ANALISTA);
    }

    private void upsert(String email, String fullName, Role role) {
        userRepositoryPort.findByEmail(email).ifPresentOrElse(user -> {
            if (user.getAccessToken() == null) {
                user.setAccessToken(newToken());
                userRepositoryPort.save(user);
            }
        }, () -> userRepositoryPort.save(new User(null, email, fullName, role, true, newToken())));
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); // 43 caracteres
    }
}