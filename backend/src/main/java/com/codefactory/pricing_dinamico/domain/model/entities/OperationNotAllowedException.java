package com.codefactory.pricing_dinamico.domain.model.entities;

public class OperationNotAllowedException extends RuntimeException {
    public OperationNotAllowedException(String message) { super(message); }
}