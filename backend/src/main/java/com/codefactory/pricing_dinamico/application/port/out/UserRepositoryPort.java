package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.User;

import java.util.List;
import java.util.Optional;

public interface UserRepositoryPort {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findById(Long id);
    List<User> findAllActive();
    User save(User user);
}
