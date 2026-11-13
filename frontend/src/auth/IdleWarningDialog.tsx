import { useEffect, useRef } from "react";

interface Props {
    secondsLeft: number;
    totalSeconds: number;
    onStay: () => void;
    onLogout: () => void;
}

/** Aviso previo al cierre por inactividad. Enter o Escape mantienen la sesión. */
export default function IdleWarningDialog({ secondsLeft, totalSeconds, onStay, onLogout }: Props) {
    const stayRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        stayRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") { e.preventDefault(); onStay(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onStay]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1117]/30 px-4 backdrop-blur-[2px]">
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="idle-title"
                aria-describedby="idle-desc"
                className="w-full max-w-[380px] overflow-hidden rounded-xl border border-[#e2e6ed] bg-white shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]"
            >
                <div className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fffbeb] text-[#d97706]">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <circle cx="8" cy="8" r="6.25" />
                            <path d="M8 4.75V8l2.25 1.5" />
                        </svg>
                    </div>
                    <h2 id="idle-title" className="text-[17px] font-semibold text-[#0f1117]">¿Sigues ahí?</h2>
                    <p id="idle-desc" className="mt-1.5 text-[13px] leading-relaxed text-[#4b5563]">
                        Por seguridad, tu sesión se cerrará por inactividad en{" "}
                        <span className="font-semibold tabular-nums text-[#0f1117]">{minutes}:{seconds}</span>.
                    </p>
                    {/* Lectores de pantalla: solo anuncia los últimos segundos para no saturar */}
                    <span className="sr-only" aria-live="assertive">
                        {secondsLeft <= 10 ? `${secondsLeft} segundos` : ""}
                    </span>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-[6px] border border-[#e2e6ed] px-3.5 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f5f7fa]"
                        >
                            Cerrar sesión
                        </button>
                        <button
                            ref={stayRef}
                            type="button"
                            onClick={onStay}
                            className="rounded-[6px] bg-[#1a56db] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1648b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db]/40 focus-visible:ring-offset-2"
                        >
                            Seguir conectado
                        </button>
                    </div>
                </div>
                <div className="h-1 bg-[#f1f3f7]">
                    <div
                        className="h-full bg-[#d97706] transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
