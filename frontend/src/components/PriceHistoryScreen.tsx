import { useState } from "react";

const PRODUCTS_LIST = [
  "Suscripción Premium Mensual",
  "Suscripción Básica Mensual",
  "Envío Express 24h",
  "Almacenamiento Corporativo 1TB",
];

const HISTORY = [
  { date: "10 Sep 2026, 14:32", prev: 35800, next: 42966, cause: "Ajuste alta demanda", up: true },
  { date: "10 Sep 2026, 08:05", prev: 29900, next: 35800, cause: "Recargo hora pico", up: true },
  { date: "09 Sep 2026, 20:14", prev: 34100, next: 29900, cause: "Fin de vigencia: hora pico", up: false },
  { date: "09 Sep 2026, 18:00", prev: 29900, next: 34100, cause: "Recargo hora pico", up: true },
  { date: "08 Sep 2026, 12:00", prev: 32500, next: 29900, cause: "Demanda: Media → Baja", up: false },
  { date: "07 Sep 2026, 09:20", prev: 29900, next: 32500, cause: "Stock crítico <10%", up: true },
  { date: "06 Sep 2026, 00:00", prev: 27400, next: 29900, cause: "Temporada alta activa", up: true },
  { date: "05 Sep 2026, 18:45", prev: 29900, next: 27400, cause: "Descuento baja demanda", up: false },
];

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function PriceHistoryScreen() {
  const [selected, setSelected] = useState(PRODUCTS_LIST[0]);
  const [showEmpty, setShowEmpty] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Historial de Precios</h1>
        <button
          onClick={() => setShowEmpty(!showEmpty)}
          className="px-3 py-2 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors"
        >
          {showEmpty ? "Ver historial" : "Ver estado vacío"}
        </button>
      </div>

      {/* Product selector */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-[13px] font-semibold text-[#374151]">Producto:</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="px-3 py-2 text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
        >
          {PRODUCTS_LIST.map((p) => <option key={p}>{p}</option>)}
        </select>
        <span className="text-[12px] text-[#9ca3af]">— Mostrando cambios más recientes primero</span>
      </div>

      {showEmpty ? (
        <EmptyHistory />
      ) : (
        <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                <th className="text-left px-5 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Fecha y hora</th>
                <th className="text-right px-5 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Precio anterior</th>
                <th className="text-right px-5 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Precio nuevo</th>
                <th className="text-left px-5 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Causa</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h, i) => (
                <tr key={i} className={`${i < HISTORY.length - 1 ? "border-b border-[#f1f3f7]" : ""} hover:bg-[#f8f9fb] transition-colors`}>
                  <td className="px-5 py-3 font-mono text-[12px] text-[#6b7280]">{h.date}</td>
                  <td className="px-5 py-3 text-right text-[#9ca3af]">{fmt(h.prev)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${h.up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                      {h.up ? "↑" : "↓"} {fmt(h.next)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-[#e8ecf2] text-[#374151] text-[11px] font-medium rounded-full">
                      {h.cause}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e8ecf2] flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 2.3-5.9" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-[#0f1117] font-display mb-1">Sin historial de cambios</h3>
      <p className="text-[13px] text-[#6b7280] max-w-xs">
        Este producto no tiene historial de cambios de precio. Los ajustes futuros realizados por el motor aparecerán aquí.
      </p>
    </div>
  );
}
