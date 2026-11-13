package com.codefactory.pricing_dinamico.domain.model.entities;

/** La sesión ya no se puede renovar; {@link #getReason()} indica al frontend qué mensaje mostrar. */
public class SessionEndedException extends RuntimeException {
    public enum Reason { IDLE_TIMEOUT, SESSION_EXPIRED, INVALID }

    private final Reason reason;

    public SessionEndedException(Reason reason) {
        super(switch (reason) {
            case IDLE_TIMEOUT -> "La sesión se cerró por inactividad.";
            case SESSION_EXPIRED -> "La sesión expiró. Inicie sesión de nuevo.";
            case INVALID -> "Sesión no válida. Inicie sesión de nuevo.";
        });
        this.reason = reason;
    }

    public Reason getReason() { return reason; }
}
