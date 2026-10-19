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
    public User authenticate(String token) {
        if (token == null || token.isBlank()) {
            throw new ProfileRequiredException("Debe seleccionar un perfil para realizar esta acción.");
        }
        return userRepositoryPort.findByAccessToken(token.trim())
                .filter(User::isActive)
                .orElseThrow(() -> new ProfileRequiredException("Token inválido o perfil inactivo."));
    }

    @Override
    public void checkCanModify(String token) {
        User user = authenticate(token);
        if (!user.canModify()) {
            throw new OperationNotAllowedException(
                    "Su perfil (" + user.getRole() + ") no tiene permiso para realizar esta acción.");
        }
    }

}
