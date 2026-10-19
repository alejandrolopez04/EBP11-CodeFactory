package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

public final class BearerTokenExtractor {
    private static final String PREFIX = "Bearer ";

    private BearerTokenExtractor() {}

    public static String extract(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(PREFIX)) {
            return null;
        }
        return authorizationHeader.substring(PREFIX.length()).trim();
    }
}
