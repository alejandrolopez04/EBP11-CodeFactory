import type { SessionEndReason } from "../api/auth";

/**
 * Mensajes entre pestañas de la misma app (BroadcastChannel):
 * - activity: hubo actividad en otra pestaña, así que esta tampoco está inactiva.
 * - logout: se cerró la sesión en otra pestaña; esta vuelve al login sin llamar al servidor.
 * - login: se inició sesión en otra pestaña; esta la recupera con la cookie.
 */
export type SessionMessage =
    | { type: "activity"; at: number }
    | { type: "logout"; reason?: SessionEndReason }
    | { type: "login" };

const channel: BroadcastChannel | null =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("pricing-session") : null;

export function broadcast(message: SessionMessage): void {
    try { channel?.postMessage(message); } catch { /* canal cerrado */ }
}

export function onSessionMessage(handler: (message: SessionMessage) => void): () => void {
    if (!channel) return () => {};
    const listener = (e: MessageEvent<SessionMessage>) => handler(e.data);
    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
}
