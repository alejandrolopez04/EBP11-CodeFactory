import { useState } from "react";

const RULES_EVALUATED = [
  { name: "Recargo hora pico", met: true, effect: "+18%" },
  { name: "Ajuste alta demanda", met: true, effect: "+22%" },
  { name: "Descuento baja demanda", met: false, effect: "Sin efecto" },
  { name: "Stock crítico", met: false, effect: "Sin efecto" },
];

export default function ProductDetailScreen({ onBack }: { onBack: () => void }) {
  const [varOpen, setVarOpen] = useState(false);

  const base = 29900;
  const current = 42966; // after rules

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a56db] transition-colors mb-5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
        Volver a Productos
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1117] font-display">Suscripción Premium Mensual</h1>
          <span className="font-mono text-[12px] text-[#9ca3af] mt-0.5 block">SKU: SUB-PRE-001</span>
        </div>
        <button className="px-3 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8a6 6 0 1 0 1.5-3.9" />
            <path d="M2 3v3.5L5.5 8" />
          </svg>
          Ver historial
        </button>
      </div>

      {/* Price card */}
      <div className="bg-white border border-[#e2e6ed] rounded-[10px] p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-8">
            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Precio base</div>
              <div className="text-[22px] font-bold text-[#374151] font-display">${base.toLocaleString("es-CL")}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Precio actual calculado</div>
              <div className="text-[32px] font-bold text-[#1a56db] font-display">${current.toLocaleString("es-CL")}</div>
              <div className="text-[12px] text-[#16a34a] font-medium mt-0.5">
                ↑ +{(((current - base) / base) * 100).toFixed(0)}% sobre el precio base
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fefce8] border border-amber-200 text-amber-700 text-[12px] font-semibold rounded-full">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2v4M6 8v1" />
              <circle cx="6" cy="6" r="5" />
            </svg>
            Ajustado por reglas activas
          </span>
        </div>

        {/* Calculation breakdown */}
        <div className="mt-5 pt-4 border-t border-[#f1f3f7] flex items-center gap-2 text-[13px] text-[#374151]">
          <span className="font-mono text-[#6b7280]">${base.toLocaleString("es-CL")}</span>
          <span className="text-[#9ca3af]">base</span>
          <span className="text-[#9ca3af] mx-1">+</span>
          <span className="font-mono text-[#16a34a]">+18%</span>
          <span className="text-[#9ca3af] text-[11px]">hora pico</span>
          <span className="text-[#9ca3af] mx-1">+</span>
          <span className="font-mono text-[#16a34a]">+22%</span>
          <span className="text-[#9ca3af] text-[11px]">alta demanda</span>
          <span className="text-[#9ca3af] mx-2">=</span>
          <span className="font-mono font-bold text-[#1a56db]">${current.toLocaleString("es-CL")}</span>
        </div>
      </div>

      {/* Rules evaluated */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-[#e2e6ed] bg-[#f8f9fb]">
          <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">Reglas evaluadas</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#f1f3f7]">
              <th className="text-left px-5 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide">Nombre de la regla</th>
              <th className="text-center px-5 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide">¿Cumplida?</th>
              <th className="text-right px-5 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide">Efecto aplicado</th>
            </tr>
          </thead>
          <tbody>
            {RULES_EVALUATED.map((r, i) => (
              <tr key={r.name} className={`${i < RULES_EVALUATED.length - 1 ? "border-b border-[#f1f3f7]" : ""} hover:bg-[#f8f9fb] transition-colors`}>
                <td className="px-5 py-3 font-medium text-[#0f1117]">{r.name}</td>
                <td className="px-5 py-3 text-center">
                  {r.met ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#dcfce7]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#f1f3f7]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2L2 8" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-mono text-[12px] font-semibold ${r.met ? "text-[#16a34a]" : "text-[#9ca3af]"}`}>{r.effect}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Variables section — collapsible */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
        <button
          onClick={() => setVarOpen(!varOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#f8f9fb] transition-colors"
        >
          <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">Variables evaluadas en este cálculo</h2>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"
            className={`transition-transform ${varOpen ? "rotate-180" : ""}`}
          >
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
        {varOpen && (
          <div className="px-5 pb-4 pt-1 border-t border-[#f1f3f7] grid grid-cols-3 gap-3">
            {[
              { label: "Demanda", value: "Alta", icon: "📈", color: "text-[#16a34a] bg-[#dcfce7]" },
              { label: "Disponibilidad", value: "62%", icon: "📦", color: "text-[#374151] bg-[#e8ecf2]" },
              { label: "Horario", value: "Hora pico", icon: "🕐", color: "text-amber-700 bg-amber-50" },
            ].map((v) => (
              <div key={v.label} className="border border-[#e2e6ed] rounded-[6px] p-3">
                <div className="text-[11px] font-semibold text-[#6b7280] mb-2">{v.label}</div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-semibold ${v.color}`}>
                  <span>{v.icon}</span>
                  {v.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
