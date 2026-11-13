package com.codefactory.pricing_dinamico.domain.model.entities;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() { super("Correo o contraseña incorrectos."); }
}
