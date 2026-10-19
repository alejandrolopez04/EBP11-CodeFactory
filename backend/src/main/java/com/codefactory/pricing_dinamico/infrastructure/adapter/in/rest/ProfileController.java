package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetProfilesUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final GetProfilesUseCase getProfilesUseCase;
    private final AuthorizeOperationUseCase authorizeOperationUseCase;

    public ProfileController(GetProfilesUseCase getProfilesUseCase,
                             AuthorizeOperationUseCase authorizeOperationUseCase) {
        this.getProfilesUseCase = getProfilesUseCase;
        this.authorizeOperationUseCase = authorizeOperationUseCase;
    }

    public record ProfileResponse(Long id, String fullName, String email, Role role, String accessToken) {
        static ProfileResponse from(User u) {
            return new ProfileResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getAccessToken());
        }
    }

    // Atajo del sprint: el switch obtiene aquí los tokens. Con login, se elimina accessToken de esta lista.
    @GetMapping
    public List<ProfileResponse> getProfiles() {
        return getProfilesUseCase.getProfiles().stream().map(ProfileResponse::from).toList();
    }

    // Perfil dueño del token: el frontend lo usa para validar el token guardado al recargar.
    @GetMapping("/me")
    public ProfileResponse me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ProfileResponse.from(authorizeOperationUseCase.authenticate(BearerTokenExtractor.extract(authorization)));
    }
}