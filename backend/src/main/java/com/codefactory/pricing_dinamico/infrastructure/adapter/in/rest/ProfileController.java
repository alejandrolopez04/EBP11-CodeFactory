package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.GetProfilesUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.Role;
import com.codefactory.pricing_dinamico.domain.model.entities.User;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final GetProfilesUseCase getProfilesUseCase;

    public ProfileController(GetProfilesUseCase getProfilesUseCase) {
        this.getProfilesUseCase = getProfilesUseCase;
    }

    public record ProfileResponse(Long id, String fullName, String email, Role role) {
        static ProfileResponse from(User u) {
            return new ProfileResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
        }
    }

    @GetMapping
    public List<ProfileResponse> getProfiles() {
        return getProfilesUseCase.getProfiles().stream().map(ProfileResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ProfileResponse getProfile(@PathVariable Long id) {
        return ProfileResponse.from(getProfilesUseCase.getProfile(id));
    }
}
