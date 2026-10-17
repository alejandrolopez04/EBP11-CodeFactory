import { useEffect, useState } from "react";
import { API_URL } from "../api/client";

const DASHBOARD_API_URL = `${API_URL}/api/dashboard`;
const REFRESH_MS = 15000;

interface RecentUpdate {
    traceId: number;
    productName: string;
    previousPrice: number | null;
    finalPrice: number;
    triggerType: string;
    trigger: string;
    clampedToMax: boolean;
    clampedToMin: boolean;
    at: string;
}

interface Dashboard {
    activeProducts: number;
    activeRules: number;
    updatesToday: number;
    productsAffectedToday: number;
    increasesToday: number;
    decreasesToday: number;
    nextChange: { at: string; description: string; products: number } | null;
    recentUpdates: RecentUpdate[];
}

const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export default function DashboardScreen() {
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(DASHBOARD_API_URL);
                if (!res.ok) throw new Error();
                setData(await res.json());
                setError(null);
            } catch {
                setError("No se pudo cargar el resumen. Verifica que el backend esté corriendo.");
            }
        };
        load();
        const id = setInterval(load, REFRESH_MS);
        return () => clearInterval(id);
    }, []);

    const cards = data
        ? [
            { label: "Productos activos", value: data.activeProducts, sub: "En el catálogo" },
            { label: "Reglas activas", value: data.activeRules, sub: "Evaluándose automáticamente" },
            {
                label: "Ajustes de precio hoy",
                value: data.updatesToday,
                sub: `${data.increasesToday} alzas, ${data.decreasesToday} bajas en ${data.productsAffectedToday} productos`,
            },
        ]
        : [];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-6">Dashboard</h1>

            {error && (
                <div className="mb-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
                {cards.map((s) => (
                    <div key={s.label} className="bg-white rounded-[8px] border border-[#e2e6ed] p-5">
                        <div className="text-[13px] text-[#6b7280] mb-1">{s.label}</div>
                        <div className="text-3xl font-bold text-[#0f1117] font-display">{s.value}</div>
                        <div className="text-[12px] text-[#6b7280] mt-1">{s.sub}</div>
                    </div>
                ))}
            </div>

            {data && (
                <div className="mb-6 px-4 py-3 bg-[#eef4ff] border border-[#c7d7fe] rounded-[8px] text-[13px] text-[#1e3a8a]">
                    {data.nextChange
                        ? <>Próximo cambio automático: <strong>{data.nextChange.description}</strong>, {fmtTime(data.nextChange.at)}, afecta a {data.nextChange.products} producto(s).</>
                        : "No hay cambios de precio programados. Ninguna regla activa depende del horario ni de una vigencia futura."}
                </div>
            )}

            <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-x-auto">
                <div className="px-4 py-3 border-b border-[#e2e6ed] text-[14px] font-semibold text-[#0f1117]">
                    Actualizaciones recientes
                </div>
                {data && data.recentUpdates.length === 0 ? (
                    <p className="px-4 py-6 text-[13px] text-[#6b7280]">
                        Aún no hay ajustes de precio. Aparecerán aquí cuando una regla cambie el precio de un producto.
                    </p>
                ) : (
                    <table className="w-full text-[13px]">
                        <thead>
                        <tr className="bg-[#f8f9fb] text-[11px] text-[#6b7280] text-left">
                            <th className="px-4 py-2 font-semibold">Producto</th>
                            <th className="px-4 py-2 font-semibold text-right">Antes</th>
                            <th className="px-4 py-2 font-semibold text-right">Ahora</th>
                            <th className="px-4 py-2 font-semibold">Motivo</th>
                            <th className="px-4 py-2 font-semibold">Hora</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data?.recentUpdates.map((u) => {
                            const diff = u.previousPrice === null ? 0 : u.finalPrice - u.previousPrice;
                            const pct = u.previousPrice ? (diff / u.previousPrice) * 100 : 0;
                            const color = diff > 0 ? "text-[#16a34a]" : diff < 0 ? "text-[#dc2626]" : "text-[#6b7280]";
                            const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "–";
                            return (
                                <tr key={u.traceId} className="border-t border-[#f1f3f7]">
                                    <td className="px-4 py-2.5 font-medium text-[#0f1117]">{u.productName}</td>
                                    <td className="px-4 py-2.5 text-right text-[#6b7280]">
                                        {u.previousPrice !== null ? fmt(u.previousPrice) : "—"}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap ${color}`}>
                                        {fmt(u.finalPrice)}
                                        <span className="ml-1.5 text-[11px] font-medium">
    {arrow} {diff !== 0 && `${Math.abs(pct).toFixed(1)}%`}
  </span>
                                        {(u.clampedToMax || u.clampedToMin) && (
                                            <span className="ml-1.5 text-[11px] font-medium text-[#b45309]">
      {u.clampedToMax ? "(tope máx.)" : "(tope mín.)"}
    </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-[#374151]">{u.trigger}</td>
                                    <td className="px-4 py-2.5 text-[#6b7280] whitespace-nowrap">{fmtTime(u.at)}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}