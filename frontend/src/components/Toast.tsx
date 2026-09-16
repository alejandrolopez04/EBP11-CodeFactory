import { useEffect } from "react";

interface ToastProps {
    message: string;
    onClose: () => void;
    type?: "success" | "error";
}

export default function Toast({ message, onClose, type = "success" }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === "success";

    return (
        <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right">
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-[8px] shadow-lg border text-[13px] font-medium ${
                    isSuccess
                        ? "bg-white border-[#bbf7d0] text-[#16a34a]"
                        : "bg-white border-[#fecaca] text-[#dc2626]"
                }`}
            >
        <span
            className={`w-2 h-2 rounded-full ${isSuccess ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
        />
                {message}
                <button onClick={onClose} className="ml-2 text-[#9ca3af] hover:text-[#374151]">
                    ✕
                </button>
            </div>
        </div>
    );
}