package com.codefactory.pricing_dinamico.config;

import com.codefactory.pricing_dinamico.application.port.out.PasswordHasherPort;
import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Crea los usuarios iniciales y les asigna la contraseña de las variables de entorno
 * ADMIN_PASSWORD y ANALISTA_PASSWORD. La variable manda: si cambia, la contraseña se actualiza
 * en el siguiente arranque. Sin variable, el usuario existe pero no puede iniciar sesión.
 */
@Component
public class UserSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepositoryPort users;
    private final PasswordHasherPort hasher;
    private final AuthProperties props;

    public UserSeeder(UserRepositoryPort users, PasswordHasherPort hasher, AuthProperties props) {
        this.users = users;
        this.hasher = hasher;
        this.props = props;
    }

    @Override
    public void run(String... args) {
        AuthProperties.Seed seed = props.seed();
        upsert("admin@pricing.com", "Diego Candamil", Role.ADMIN, seed == null ? null : seed.adminPassword());
        upsert("analista@pricing.com", "Alejandro Lopez", Role.ANALISTA, seed == null ? null : seed.analistaPassword());
    }

    private void upsert(String email, String fullName, Role role, String password) {
        User user = users.findByEmail(email)
                .orElseGet(() -> new User(null, email, fullName, role, true, null, 0, null));
        boolean changed = user.getId() == null;

        if (password == null || password.isBlank()) {
            if (user.getPasswordHash() == null) {
                log.warn("{} no tiene contraseña: configure la variable de entorno correspondiente.", email);
            }
        } else if (password.length() < MIN_PASSWORD_LENGTH) {
            log.warn("La contraseña configurada para {} tiene menos de {} caracteres; se ignora.",
                    email, MIN_PASSWORD_LENGTH);
        } else if (!hasher.matches(password, user.getPasswordHash())) {
            user.setPasswordHash(hasher.hash(password));
            user.resetFailedLogins();
            changed = true;
            log.info("Contraseña de {} actualizada desde la configuración.", email);
        }
        if (changed) users.save(user);
    }
}
