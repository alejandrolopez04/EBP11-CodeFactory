import type { ReactNode } from "react";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "./AuthContext";
import LoginScreen from "./LoginScreen";
import IdleSessionManager from "./IdleSessionManager";

/** Muestra la app solo con sesión; al cerrarla, la app se desmonta y su estado se descarta. */
export default function AuthGate({ children }: { children: ReactNode }) {
    const { status } = useAuth();

    if (status === "loading") {
        return (
            <div className="h-full bg-[#f4f5f7]">
                <LoadingScreen label="Verificando sesión…" />
            </div>
        );
    }
    if (status === "anonymous") return <LoginScreen />;
    return (
        <>
            {children}
            <IdleSessionManager />
        </>
    );
}
