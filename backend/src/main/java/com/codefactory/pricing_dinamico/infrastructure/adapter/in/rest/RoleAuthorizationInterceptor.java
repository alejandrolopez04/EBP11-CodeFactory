package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.Set;

@Component
public class RoleAuthorizationInterceptor implements HandlerInterceptor {
    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD");

    private final AuthorizeOperationUseCase authorizeOperationUseCase;

    public RoleAuthorizationInterceptor(AuthorizeOperationUseCase authorizeOperationUseCase) {
        this.authorizeOperationUseCase = authorizeOperationUseCase;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equals(request.getMethod())) {
            return true; // preflight de CORS
        }
        String token = BearerTokenExtractor.extract(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (READ_METHODS.contains(request.getMethod())) {
            authorizeOperationUseCase.authenticate(token);   // cualquier perfil válido
        } else {
            authorizeOperationUseCase.checkCanModify(token); // solo ADMIN
        }
        return true;
    }
}
