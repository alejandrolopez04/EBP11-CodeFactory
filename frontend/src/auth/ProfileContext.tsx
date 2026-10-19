import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken } from "../api/http";
import { fetchMe, fetchProfiles, type Profile } from "../api/profile";

interface ProfileContextValue {
    profiles: Profile[];
    current: Profile | null;
    canModify: boolean;
    switchProfile: (id: number) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [current, setCurrent] = useState<Profile | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchProfiles();
                const saved = getToken();
                // 1) intenta restaurar el perfil guardado; 2) si no hay o es inválido, usa el primero
                let active = saved ? await fetchMe(saved) : null;
                if (!active) active = list[0] ?? null;
                setToken(active?.accessToken ?? null);
                if (!cancelled) {
                    setProfiles(list);
                    setCurrent(active);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setIsLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const switchProfile = useCallback((id: number) => {
        const next = profiles.find((p) => p.id === id);
        if (!next) return;
        setToken(next.accessToken);
        setCurrent(next);
    }, [profiles]);

    if (!isLoaded) return null; // evita que los botones parpadeen en gris al cargar

    return (
        <ProfileContext.Provider
            value={{ profiles, current, canModify: current?.role === "ADMIN", switchProfile }}
        >
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error("useProfile debe usarse dentro de ProfileProvider");
    return ctx;
}