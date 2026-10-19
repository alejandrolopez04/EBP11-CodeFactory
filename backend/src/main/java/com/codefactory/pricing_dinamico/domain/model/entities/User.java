package com.codefactory.pricing_dinamico.domain.model.entities;

public class User {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private boolean active;
    private String accessToken;

    public User(Long id, String email, String fullName, Role role, boolean active, String accessToken) {
        this.id = id; this.email = email; this.fullName = fullName;
        this.role = role; this.active = active; this.accessToken = accessToken;
    }

    public String getAccessToken() { return accessToken; }

    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public boolean isAdmin() { return role == Role.ADMIN; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean canModify() { return role == Role.ADMIN; }
}
