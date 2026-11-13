import { API_URL } from "./config";

export type Role = "ADMIN" | "ANALISTA";

export const ROLE_LABELS: Record<Role, string> = {
    ADMIN: "Administrador",
    ANALISTA: "Analista",
};

export interface SessionUser {
    id: number;
    fullName: string;
    email: string;
    role: Role;
}

/** Respuesta de login y refresh. Las duraciones vienen en segundos. */
export interface AuthResponse {
    accessToken: string;
    expiresIn: number;
    idleTimeout: number;
    sessionExpiresIn: number;
    user: SessionUser;
}

/** Motivo con el que el backend da por terminada una sesión. */
export type SessionEndReason = "IDLE_TIMEOUT" | "SESSION_EXPIRED" | "INVALID";

export class AuthError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly reason?: SessionEndReason,
        readonly retryAfterSeconds?: number,
    ) {
        super(message);
    }
}

const AUTH_URL = `${API_URL}/api/auth`;

// credentials: "include" para que el navegador envíe y guarde la cookie HttpOnly del refresh token.
async function post(path: string, body?: unknown): Promise<Response> {
    return fetch(`${AUTH_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

async function toError(res: Response, fallback: string): Promise<AuthError> {
    let message = fallback;
    let reason: SessionEndReason | undefined;
    try {
        const data = await res.json();
        if (typeof data?.message === "string") message = data.message;
        if (typeof data?.reason === "string") reason = data.reason as SessionEndReason;
    } catch { /* cuerpo vacío */ }
    const retryAfter = Number(res.headers.get("Retry-After"));
    return new AuthError(message, res.status, reason, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    let res: Response;
    try {
        res = await post("/login", { email, password });
    } catch {
        throw new AuthError("No se pudo conectar con el servidor. Intente de nuevo.", 0);
    }
    if (!res.ok) throw await toError(res, "No se pudo iniciar sesión.");
    return res.json();
}

/** Renueva la sesión con la cookie. Lanza AuthError con `reason` si la sesión terminó. */
export async function refreshSession(): Promise<AuthResponse> {
    let res: Response;
    try {
        res = await post("/refresh");
    } catch {
        throw new AuthError("No se pudo conectar con el servidor.", 0);
    }
    if (!res.ok) throw await toError(res, "La sesión terminó.");
    return res.json();
}

export async function logoutSession(): Promise<void> {
    try {
        await post("/logout");
    } catch { /* sin red: la sesión local se cierra igual y el servidor la vence sola */ }
}

export const SESSION_END_MESSAGES: Record<SessionEndReason, string> = {
    IDLE_TIMEOUT: "Tu sesión se cerró por inactividad. Inicia sesión de nuevo.",
    SESSION_EXPIRED: "Tu sesión expiró. Inicia sesión de nuevo.",
    INVALID: "Tu sesión ya no es válida. Inicia sesión de nuevo.",
};
