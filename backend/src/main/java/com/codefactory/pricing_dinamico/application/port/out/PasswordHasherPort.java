package com.codefactory.pricing_dinamico.application.port.out;

public interface PasswordHasherPort {
    String hash(String rawPassword);

    boolean matches(String rawPassword, String hash);
}
