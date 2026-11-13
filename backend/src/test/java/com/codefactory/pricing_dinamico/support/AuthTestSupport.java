package com.codefactory.pricing_dinamico.support;

import com.codefactory.pricing_dinamico.application.port.out.PasswordHasherPort;
import com.codefactory.pricing_dinamico.application.port.out.UserRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.UserSessionRepositoryPort;
import com.codefactory.pricing_dinamico.config.AuthProperties;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import com.codefactory.pricing_dinamico.domain.model.entities.UserSession;

import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/** Dobles de prueba en memoria para la autenticación. */
public final class AuthTestSupport {
    private AuthTestSupport() {}

    public static final String SECRET = "clave-de-pruebas-con-mas-de-32-bytes-0123456789";

    public static AuthProperties props() {
        return new AuthProperties(SECRET, Duration.ofMinutes(10), Duration.ofMinutes(15), Duration.ofHours(8),
                5, Duration.ofMinutes(15),
                new AuthProperties.Cookie("pricing_refresh", true, "Lax", "/api/auth"),
                new AuthProperties.Seed(null, null));
    }

    /** Reloj que la prueba adelanta a voluntad. */
    public static final class MutableClock extends Clock {
        private Instant now;

        public MutableClock(Instant start) { this.now = start; }

        public void advance(Duration d) { now = now.plus(d); }

        @Override public Instant instant() { return now; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
    }

    /** Hash trivial y rápido: suficiente para probar la lógica sin el coste de BCrypt. */
    public static final class FakeHasher implements PasswordHasherPort {
        @Override public String hash(String raw) { return "hash:" + raw; }
        @Override public boolean matches(String raw, String hash) { return hash != null && hash.equals("hash:" + raw); }
    }

    public static final class InMemoryUsers implements UserRepositoryPort {
        private final Map<Long, User> byId = new HashMap<>();
        private final AtomicLong seq = new AtomicLong();

        @Override public Optional<User> findByEmail(String email) {
            return byId.values().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst().map(this::copy);
        }
        @Override public Optional<User> findById(Long id) { return Optional.ofNullable(byId.get(id)).map(this::copy); }
        @Override public User save(User u) {
            if (u.getId() == null) u.setId(seq.incrementAndGet());
            byId.put(u.getId(), copy(u));
            return copy(u);
        }
        public User get(Long id) { return copy(byId.get(id)); }

        private User copy(User u) {
            return new User(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isActive(),
                    u.getPasswordHash(), u.getFailedLoginAttempts(), u.getLockedUntil());
        }
    }

    public static final class InMemorySessions implements UserSessionRepositoryPort {
        private final Map<Long, UserSession> byId = new HashMap<>();
        private final AtomicLong seq = new AtomicLong();

        @Override public UserSession save(UserSession s) {
            if (s.getId() == null) s.setId(seq.incrementAndGet());
            byId.put(s.getId(), copy(s));
            return copy(s);
        }
        @Override public Optional<UserSession> findByTokenHash(String hash) {
            return byId.values().stream().filter(s -> s.getTokenHash().equals(hash)).findFirst().map(this::copy);
        }
        @Override public int deleteEndedBefore(Instant cutoff) {
            int before = byId.size();
            byId.values().removeIf(s -> s.getExpiresAt().isBefore(cutoff)
                    || (s.getRevokedAt() != null && s.getRevokedAt().isBefore(cutoff)));
            return before - byId.size();
        }
        public Collection<UserSession> all() { return byId.values(); }

        private UserSession copy(UserSession s) {
            return new UserSession(s.getId(), s.getUserId(), s.getTokenHash(), s.getCreatedAt(),
                    s.getLastActivityAt(), s.getExpiresAt(), s.getRevokedAt());
        }
    }
}
