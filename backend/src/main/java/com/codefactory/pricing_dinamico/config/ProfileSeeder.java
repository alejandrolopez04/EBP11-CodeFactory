package com.codefactory.pricing_dinamico.config;

import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ProfileSeeder implements CommandLineRunner {
    private final UserRepositoryPort userRepositoryPort;

    public ProfileSeeder(UserRepositoryPort userRepositoryPort) {
        this.userRepositoryPort = userRepositoryPort;
    }

    @Override
    public void run(String... args) {
        create("admin@pricing.com", "Ana Martínez", Role.ADMIN);
        create("analista@pricing.com", "Carlos Gómez", Role.ANALISTA);
    }

    private void create(String email, String fullName, Role role) {
        if (!userRepositoryPort.existsByEmail(email)) {
            userRepositoryPort.save(new User(null, email, fullName, role, true));
        }
    }
}
