import { API_URL } from "../api/client";
import { apiFetch } from "../api/http";

export type Role = "ADMIN" | "ANALISTA";

export interface Profile {
    id: number;
    fullName: string;
    email: string;
    role: Role;
    accessToken: string;
}

export const ROLE_LABELS: Record<Role, string> = {
    ADMIN: "Administrador",
    ANALISTA: "Analista",
};

export async function fetchProfiles(): Promise<Profile[]> {
    const res = await fetch(`${API_URL}/api/profiles`);
    if (!res.ok) throw new Error("No se pudieron cargar los perfiles.");
    return res.json();
}

/** Devuelve el perfil dueño del token, o null si el token ya no es válido. */
export async function fetchMe(token: string): Promise<Profile | null> {
    const res = await fetch(`${API_URL}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : null;
}