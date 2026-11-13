import { AuthError, refreshSession, type AuthResponse, type SessionEndReason } from "./auth";

/**
 * Sesión del lado del cliente.
 * - El access token vive solo en memoria (no en localStorage): un script inyectado no puede leerlo
 *   después de recargar, y al cerrar la pestaña desaparece.
 * - El refresh token está en una cookie HttpOnly que solo el navegador envía a /api/auth.
 */
let accessToken: string | null = null;
let accessExpiresAt = 0; // epoch ms
let refreshInFlight: Promise<AuthResponse> | null = null;

type SessionListener = {
    onRefreshed: (session: AuthResponse) => void;
    onEnded: (reason: SessionEndReason) => void;
};
let listener: SessionListener | null = null;

/** El AuthProvider se registra para enterarse de renovaciones y de sesiones terminadas. */
export function setSessionListener(l: SessionListener | null): void {
    listener = l;
}

let lastRenewedAt = 0; // epoch ms del último login o renovación (lo que el servidor cuenta como actividad)

export function applySession(session: AuthResponse): void {
    accessToken = session.accessToken;
    accessExpiresAt = Date.now() + session.expiresIn * 1000;
    lastRenewedAt = Date.now();
}

export function clearSession(): void {
    accessToken = null;
    accessExpiresAt = 0;
    lastRenewedAt = 0;
}

/** Tiempos de la sesión actual, para que el gestor de inactividad decida cuándo renovar. */
export function sessionTimes(): { accessExpiresAt: number; lastRenewedAt: number } {
    return { accessExpiresAt, lastRenewedAt };
}

/**
 * Renueva la sesión una sola vez aunque la pidan varias peticiones a la vez: el refresh token
 * rota en cada uso, así que dos renovaciones simultáneas harían que la segunda fallara.
 * Entre pestañas se serializa con Web Locks: la segunda pestaña espera y envía la cookie ya rotada.
 */
export function refreshOnce(): Promise<AuthResponse> {
    if (!refreshInFlight) {
        const run = () => refreshSession();
        const locked: Promise<AuthResponse> = typeof navigator !== "undefined" && navigator.locks
            ? navigator.locks.request("pricing-session-refresh", run).then((inner) => inner)
            : run();
        refreshInFlight = locked
            .then((session) => {
                applySession(session);
                listener?.onRefreshed(session);
                return session;
            })
            .catch((e) => {
                if (e instanceof AuthError && e.status === 401) {
                    clearSession();
                    listener?.onEnded(e.reason ?? "INVALID");
                }
                throw e;
            })
            .finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
}

const EXPIRY_MARGIN_MS = 15_000;

/**
 * fetch que adjunta Authorization: Bearer <token>.
 * Si el token está por vencer lo renueva antes; si la API responde 401, renueva y reintenta una vez.
 * Si la renovación falla, el AuthProvider muestra el login con el motivo.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    if (accessToken && Date.now() > accessExpiresAt - EXPIRY_MARGIN_MS) {
        await refreshOnce().catch(() => undefined);
    }
    const res = await fetch(input, withToken(init));
    if (res.status !== 401 || new Headers(init.headers).has("Authorization")) return res;

    try {
        await refreshOnce();
    } catch {
        return res; // la sesión terminó: se devuelve el 401 original
    }
    return fetch(input, withToken(init));
}

function withToken(init: RequestInit): RequestInit {
    const headers = new Headers(init.headers);
    if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return { ...init, headers };
}
