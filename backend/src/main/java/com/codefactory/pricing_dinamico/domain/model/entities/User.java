package com.codefactory.pricing_dinamico.domain.model.entities;

import java.time.Duration;
import java.time.Instant;

public class User {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private boolean active;
    private String passwordHash;
    private int failedLoginAttempts;
    private Instant lockedUntil;

    public User(Long id, String email, String fullName, Role role, boolean active,
                String passwordHash, int failedLoginAttempts, Instant lockedUntil) {
        this.id = id; this.email = email; this.fullName = fullName;
        this.role = role; this.active = active; this.passwordHash = passwordHash;
        this.failedLoginAttempts = failedLoginAttempts; this.lockedUntil = lockedUntil;
    }

    /** Usuario reconstruido a partir de los datos del token, sin credenciales. */
    public static User fromClaims(Long id, String email, String fullName, Role role) {
        return new User(id, email, fullName, role, true, null, 0, null);
    }

    public boolean isAdmin() { return role == Role.ADMIN; }

    public boolean canModify() { return role == Role.ADMIN; }

    public boolean isLocked(Instant now) { return lockedUntil != null && now.isBefore(lockedUntil); }

    /** Suma un intento fallido; al llegar al máximo bloquea la cuenta durante {@code lockout}. */
    public void registerFailedLogin(Instant now, int maxAttempts, Duration lockout) {
        failedLoginAttempts++;
        if (failedLoginAttempts >= maxAttempts) {
            lockedUntil = now.plus(lockout);
            failedLoginAttempts = 0;
        }
    }

    /** Limpia el contador tras un ingreso correcto. Devuelve true si había algo que limpiar. */
    public boolean resetFailedLogins() {
        boolean changed = failedLoginAttempts != 0 || lockedUntil != null;
        failedLoginAttempts = 0;
        lockedUntil = null;
        return changed;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public Instant getLockedUntil() { return lockedUntil; }
}
