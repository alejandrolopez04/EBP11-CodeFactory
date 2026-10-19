package com.codefactory.pricing_dinamico.application.port.out;

import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetProfilesUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.OperationNotAllowedException;
import com.codefactory.pricing_dinamico.domain.model.entities.ProfileRequiredException;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProfileService implements GetProfilesUseCase, AuthorizeOperationUseCase {
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

    @Override
    public void checkCanModify(String profileIdHeader) {
        if (profileIdHeader == null || profileIdHeader.isBlank()) {
            throw new ProfileRequiredException("Debe seleccionar un perfil para realizar esta acción.");
        }
        Long id;
        try {
            id = Long.parseLong(profileIdHeader.trim());
        } catch (NumberFormatException e) {
            throw new ProfileRequiredException("Perfil inválido.");
        }
        User user = userRepositoryPort.findById(id)
                .filter(User::isActive)
                .orElseThrow(() -> new ProfileRequiredException("Perfil inválido o inactivo."));
        if (!user.canModify()) {
            throw new OperationNotAllowedException("Su perfil (" + user.getRole() + ") no tiene permiso para realizar esta acción.");
        }
    }

}
