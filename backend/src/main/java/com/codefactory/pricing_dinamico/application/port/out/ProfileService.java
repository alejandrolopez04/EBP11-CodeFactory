package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.application.port.in.GetProfilesUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProfileService implements GetProfilesUseCase {
    private final UserRepositoryPort userRepositoryPort;

    public ProfileService(UserRepositoryPort userRepositoryPort) {
        this.userRepositoryPort = userRepositoryPort;
    }

    @Override
    public List<User> getProfiles() {
        return userRepositoryPort.findAllActive();
    }

    @Override
    public User getProfile(Long id) {
        return userRepositoryPort.findById(id)
                .filter(User::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Perfil no encontrado o inactivo."));
    }
}
