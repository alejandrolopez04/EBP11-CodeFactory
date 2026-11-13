import type { ButtonHTMLAttributes } from "react";
import { useAuth } from "./AuthContext";

export default function RestrictedButton({
                                             disabled, title, className = "", ...props
                                         }: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { canModify } = useAuth();
    const blocked = !canModify;

    return (
        <button
            {...props}
            disabled={disabled || blocked}
            title={blocked ? "Solo disponible para administradores" : title}
            className={`${className} disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed`}
        />
    );
}