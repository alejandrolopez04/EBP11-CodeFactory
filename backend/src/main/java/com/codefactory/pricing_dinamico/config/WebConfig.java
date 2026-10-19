package com.codefactory.pricing_dinamico.config;

import com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest.RoleAuthorizationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final RoleAuthorizationInterceptor roleAuthorizationInterceptor;

    public WebConfig(RoleAuthorizationInterceptor roleAuthorizationInterceptor) {
        this.roleAuthorizationInterceptor = roleAuthorizationInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(roleAuthorizationInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/profiles"); // temporal hasta la HU de login
    }
}
