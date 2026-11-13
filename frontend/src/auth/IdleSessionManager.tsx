import { useCallback, useEffect, useRef, useState } from "react";
import { refreshOnce, sessionTimes } from "../api/http";
import { useAuth } from "./AuthContext";
import { broadcast, onSessionMessage } from "./sessionChannel";
import IdleWarningDialog from "./IdleWarningDialog";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;
const BROADCAST_EVERY_MS = 10_000;
const RENEW_BEFORE_EXPIRY_MS = 60_000;

/**
 * Cierre de sesión por inactividad (solo con sesión iniciada).
 * - Actividad = mouse, teclado, scroll o toque en cualquier pestaña de la app.
 * - Si el usuario está activo, renueva la sesión antes de que el servidor la considere inactiva.
 * - Antes del cierre muestra un aviso con cuenta regresiva; al llegar a cero cierra la sesión.
 */
export default function IdleSessionManager() {
    const { idleTimeoutSeconds, logout } = useAuth();
    const idleMs = (idleTimeoutSeconds ?? 900) * 1000;
    // Aviso de 60 s, o un tercio del tiempo si la inactividad configurada es muy corta.
    const warningMs = Math.min(60_000, Math.floor(idleMs / 3));

    const lastActivityRef = useRef(Date.now());
    const lastBroadcastRef = useRef(0);
    const warningRef = useRef(false);
    const endingRef = useRef(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const markActive = useCallback((at = Date.now(), share = true) => {
        lastActivityRef.current = Math.max(lastActivityRef.current, at);
        if (share && at - lastBroadcastRef.current > BROADCAST_EVERY_MS) {
            lastBroadcastRef.current = at;
            broadcast({ type: "activity", at });
        }
    }, []);

    // Actividad local. Con el aviso abierto no cuenta mover el mouse: hay que confirmar con el botón.
    useEffect(() => {
        const onActivity = () => { if (!warningRef.current) markActive(); };
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
        return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
    }, [markActive]);

    // Actividad en otras pestañas: también cierra el aviso aquí.
    useEffect(() => onSessionMessage((m) => {
        if (m.type === "activity") markActive(m.at, false);
    }), [markActive]);

    const tick = useCallback(() => {
        if (endingRef.current) return;
        const now = Date.now();
        const remaining = lastActivityRef.current + idleMs - now;

        if (remaining <= 0) {
            endingRef.current = true;
            void logout("IDLE_TIMEOUT");
            return;
        }

        const warn = remaining <= warningMs;
        warningRef.current = warn;
        setSecondsLeft(warn ? Math.ceil(remaining / 1000) : null);

        // Renovación por actividad: el servidor solo ve las renovaciones, así que si hubo actividad
        // desde la última, renueva antes de que venza el token o pase la mitad del tiempo de inactividad.
        const { accessExpiresAt, lastRenewedAt } = sessionTimes();
        const activeSinceRenewal = lastActivityRef.current > lastRenewedAt;
        const due = now > accessExpiresAt - RENEW_BEFORE_EXPIRY_MS || now > lastRenewedAt + idleMs / 2;
        if (!warn && activeSinceRenewal && due) refreshOnce().catch(() => undefined);
    }, [idleMs, warningMs, logout]);

    useEffect(() => {
        const id = window.setInterval(tick, 1000);
        // Al volver a la pestaña (o despertar el equipo) se revisa de inmediato.
        const onVisible = () => { if (document.visibilityState === "visible") tick(); };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [tick]);

    const stayConnected = useCallback(() => {
        warningRef.current = false;
        lastBroadcastRef.current = 0; // fuerza el aviso a las otras pestañas
        markActive(Date.now());
        setSecondsLeft(null);
        refreshOnce().catch(() => undefined);
    }, [markActive]);

    if (secondsLeft === null) return null;
    return (
        <IdleWarningDialog
            secondsLeft={secondsLeft}
            totalSeconds={Math.round(warningMs / 1000)}
            onStay={stayConnected}
            onLogout={() => { endingRef.current = true; void logout(); }}
        />
    );
}
