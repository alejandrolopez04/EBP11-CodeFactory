/**
 * Base de la API. Vacía = mismo origen que el frontend: en desarrollo Vite reenvía /api al backend
 * y en producción lo hace un rewrite de Vercel, así la cookie de sesión es de primera parte.
 * VITE_API_URL solo hace falta si el backend se llama directamente desde otro dominio.
 */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";
