package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;

import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
public class UserJpaEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String fullName;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Role role;
    @Column(nullable = false)
    private boolean active = true;
    @Column(unique = true, length = 64)
    private String accessToken;

    public UserJpaEntity() {}

    public UserJpaEntity(Long id, String email, String fullName, Role role, boolean active, String accessToken) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.active = active;
        this.accessToken = accessToken;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

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
}
