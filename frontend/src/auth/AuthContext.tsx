import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    login as loginRequest,
    logoutSession,
    SESSION_END_MESSAGES,
    type AuthResponse,
    type SessionEndReason,
    type SessionUser,
} from "../api/auth";
import { applySession, clearSession, refreshOnce, setSessionListener } from "../api/http";
import { broadcast, onSessionMessage } from "./sessionChannel";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
    status: Status;
    current: SessionUser | null;
    canModify: boolean;
    /** Mensaje para la pantalla de login cuando la sesión terminó sola (inactividad, expiración). */
    notice: string | null;
    /** Segundos de inactividad que admite el servidor (lo usa el temporizador de inactividad). */
    idleTimeoutSeconds: number | null;
    login: (email: string, password: string) => Promise<void>;
    logout: (reason?: SessionEndReason) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<Status>("loading");
    const [current, setCurrent] = useState<SessionUser | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [idleTimeoutSeconds, setIdleTimeoutSeconds] = useState<number | null>(null);
    const statusRef = useRef<Status>(status);
    statusRef.current = status;

    const accept = useCallback((session: AuthResponse) => {
        setCurrent(session.user);
        setIdleTimeoutSeconds(session.idleTimeout);
        setNotice(null);
        setStatus("authenticated");
    }, []);

    /** Vuelve al login. Solo muestra aviso si había una sesión abierta (no al abrir la app sin sesión). */
    const endLocally = useCallback((reason?: SessionEndReason) => {
        const wasInside = statusRef.current === "authenticated";
        clearSession();
        setCurrent(null);
        setNotice(wasInside && reason ? SESSION_END_MESSAGES[reason] : null);
        setStatus("anonymous");
        return wasInside;
    }, []);

    // Cualquier renovación o cierre detectado por apiFetch actualiza el estado global.
    useEffect(() => {
        setSessionListener({
            onRefreshed: accept,
            onEnded: (reason) => {
                if (endLocally(reason)) broadcast({ type: "logout", reason });
            },
        });
        return () => setSessionListener(null);
    }, [accept, endLocally]);

    // Sincroniza las pestañas: cerrar sesión en una la cierra en todas; iniciarla en una la abre en las demás.
    useEffect(() => onSessionMessage((message) => {
        if (message.type === "logout") endLocally(message.reason);
        if (message.type === "login" && statusRef.current === "anonymous") refreshOnce().catch(() => undefined);
    }), [endLocally]);

    // Al cargar o recargar la página: si la cookie sigue vigente, la sesión se recupera sin pedir la contraseña.
    useEffect(() => {
        let cancelled = false;
        refreshOnce().catch(() => {
            if (!cancelled) setStatus((s) => (s === "loading" ? "anonymous" : s));
        });
        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const session = await loginRequest(email.trim(), password);
        applySession(session);
        accept(session);
        broadcast({ type: "login" });
    }, [accept]);

    /** Cierra la sesión en el servidor y en todas las pestañas. Con `reason`, el login explica por qué. */
    const logout = useCallback(async (reason?: SessionEndReason) => {
        await logoutSession();
        endLocally(reason);
        broadcast({ type: "logout", reason });
    }, [endLocally]);

    const value = useMemo<AuthContextValue>(() => ({
        status,
        current,
        canModify: current?.role === "ADMIN",
        notice,
        idleTimeoutSeconds,
        login,
        logout,
    }), [status, current, notice, idleTimeoutSeconds, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}
