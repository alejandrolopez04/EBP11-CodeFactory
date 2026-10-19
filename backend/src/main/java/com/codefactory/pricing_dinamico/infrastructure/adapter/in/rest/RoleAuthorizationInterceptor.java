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
        String token = BearerTokenExtractor.extract(request.getHeader(HttpHeaders.AUTHORIZATION));
        authorizeOperationUseCase.checkCanModify(token);
        return true;
    }
}
