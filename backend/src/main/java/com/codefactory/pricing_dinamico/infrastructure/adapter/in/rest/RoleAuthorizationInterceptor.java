package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.AuthorizeOperationUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.Set;

@Component
public class RoleAuthorizationInterceptor implements HandlerInterceptor {
    public static final String PROFILE_HEADER = "X-Profile-Id";
    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final AuthorizeOperationUseCase authorizeOperationUseCase;

    public RoleAuthorizationInterceptor(AuthorizeOperationUseCase authorizeOperationUseCase) {
        this.authorizeOperationUseCase = authorizeOperationUseCase;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (READ_METHODS.contains(request.getMethod())) {
            return true; // lecturas y preflight de CORS pasan siempre
        }
        authorizeOperationUseCase.checkCanModify(request.getHeader(PROFILE_HEADER));
        return true;
    }
}
