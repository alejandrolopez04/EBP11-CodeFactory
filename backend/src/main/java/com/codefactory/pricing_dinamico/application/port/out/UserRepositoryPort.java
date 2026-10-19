package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.domain.model.entities.User;
import java.util.Optional;

public interface UserRepositoryPort {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    User save(User user);
}
