import { useState, type FormEvent } from "react";
import { AuthError } from "../api/auth";
import { useAuth } from "./AuthContext";

export default function LoginScreen() {
    const { login, notice } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError("Ingresa tu correo y tu contraseña.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await login(email, password);
        } catch (err) {
            setError(describe(err));
            setPassword("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center bg-[#f4f5f7] px-4 py-10">
            <div className="w-full max-w-[380px]">
                <div className="mb-6 flex items-center justify-center gap-2.5">
                    <img src="/favicon.svg" alt="" className="h-8 w-8" />
                    <div>
                        <div className="font-display text-[15px] font-semibold leading-tight text-[#0f1117]">Pricing Engine</div>
                        <div className="text-[11px] font-medium text-[#6b7280]">Motor Dinámico</div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    noValidate
                    className="rounded-xl border border-[#e2e6ed] bg-white p-7 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)]"
                >
                    <h1 className="text-[20px] font-semibold text-[#0f1117]">Iniciar sesión</h1>
                    <p className="mt-1 text-[13px] text-[#6b7280]">Ingresa con tu cuenta de la plataforma.</p>

                    {notice && !error && (
                        <div role="status" className="mt-5 flex gap-2 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[12px] text-[#92400e]">
                            <ClockIcon />
                            <span>{notice}</span>
                        </div>
                    )}
                    {error && (
                        <div role="alert" className="mt-5 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#dc2626]">
                            {error}
                        </div>
                    )}

                    <label htmlFor="login-email" className="mt-5 block text-[12px] font-medium text-[#374151]">
                        Correo electrónico
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-[6px] border border-[#e2e6ed] px-3 py-2 text-[13px] text-[#0f1117] outline-none transition-shadow placeholder:text-[#9ca3af] focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/15"
                        placeholder="nombre@empresa.com"
                    />

                    <label htmlFor="login-password" className="mt-4 block text-[12px] font-medium text-[#374151]">
                        Contraseña
                    </label>
                    <div className="relative mt-1.5">
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-[6px] border border-[#e2e6ed] py-2 pl-3 pr-10 text-[13px] text-[#0f1117] outline-none transition-shadow focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/15"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            aria-pressed={showPassword}
                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#9ca3af] hover:text-[#374151]"
                        >
                            <EyeIcon off={showPassword} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 w-full rounded-[6px] bg-[#1a56db] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1648b8] disabled:cursor-wait disabled:opacity-70"
                    >
                        {submitting ? "Ingresando…" : "Ingresar"}
                    </button>
                </form>

                <p className="mt-4 text-center text-[11px] text-[#9ca3af]">
                    Por seguridad, la sesión se cierra tras un tiempo sin actividad.
                </p>
            </div>
        </div>
    );
}

function describe(err: unknown): string {
    if (err instanceof AuthError) {
        if (err.status === 429 && err.retryAfterSeconds) {
            const minutes = Math.ceil(err.retryAfterSeconds / 60);
            return `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
        }
        return err.message;
    }
    return "No se pudo iniciar sesión. Intenta de nuevo.";
}

function ClockIcon() {
    return (
        <svg aria-hidden="true" className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75V8l2.25 1.5" />
        </svg>
    );
}

function EyeIcon({ off }: { off: boolean }) {
    return (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
            <circle cx="8" cy="8" r="2" />
            {off && <path d="M2.5 13.5l11-11" />}
        </svg>
    );
}
