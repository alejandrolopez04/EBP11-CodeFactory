import { useState } from "react";
import RuleFormModal from "./RuleFormModal";

const RULES = [
  { id: "RGL-001", name: "Recargo hora pico", condition: "Horario = Hora pico", effect: "+18%", products: ["Envío Express 24h", "Suscripción Premium"], more: 2, status: true },
  { id: "RGL-002", name: "Descuento baja demanda", condition: "Demanda < Baja", effect: "−12%", products: ["Entrada General Evento"], more: 0, status: true },
  { id: "RGL-003", name: "Promoción fin de semana", condition: "Horario = Fin de semana", effect: "−$3.000", products: ["Suscripción Básica Mensual"], more: 1, status: true },
  { id: "RGL-004", name: "Ajuste alta demanda", condition: "Demanda > Alta", effect: "+22%", products: ["Entrada VIP Evento"], more: 0, status: true },
  { id: "RGL-005", name: "Stock crítico", condition: "Disponibilidad < 10%", effect: "+30%", products: ["Almacenamiento Corp.", "Soporte Prioritario"], more: 0, status: false },
  { id: "RGL-006", name: "Temporada alta", condition: "Horario = Temporada alta", effect: "+15%", products: ["Entrada VIP Evento"], more: 3, status: true },
  { id: "RGL-007", name: "Incentivo disponibilidad", condition: "Disponibilidad > 80%", effect: "−8%", products: ["Envío Estándar 5 días"], more: 0, status: false },
];

export default function PricingRulesScreen() {
  const [showModal, setShowModal] = useState(false);
  const [confirmRule, setConfirmRule] = useState<string | null>(null);
  const [rules, setRules] = useState(RULES);

  const toggleStatus = (id: string) => {
    setRules((r) => r.map((rule) => rule.id === id ? { ...rule, status: !rule.status } : rule));
    setConfirmRule(null);
  };

  const ruleToConfirm = rules.find((r) => r.id === confirmRule);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Reglas de Pricing</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors flex items-center gap-2"
        >
          <span>+</span> Crear regla
        </button>
      </div>

      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Nombre / ID</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Condición</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Efecto</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Productos</th>
              <th className="text-center px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Estado</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.id} className={`border-b border-[#f1f3f7] hover:bg-[#f8f9fb] transition-colors ${i === rules.length - 1 ? "border-none" : ""}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0f1117]">{r.name}</div>
                  <div className="font-mono text-[11px] text-[#9ca3af] mt-0.5">{r.id}</div>
                </td>
                <td className="px-4 py-3 text-[#374151]">{r.condition}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold font-mono text-[12px] ${r.effect.startsWith("+") ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                    {r.effect}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.products.slice(0, 1).map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-[#e8ecf2] text-[#374151] text-[11px] rounded-full font-medium">{p}</span>
                    ))}
                    {r.products.length > 1 && (
                      <span className="px-2 py-0.5 bg-[#f1f3f7] text-[#6b7280] text-[11px] rounded-full">+{r.products.length - 1} más</span>
                    )}
                    {r.more > 0 && (
                      <span className="px-2 py-0.5 bg-[#f1f3f7] text-[#6b7280] text-[11px] rounded-full">+{r.more} más</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    r.status ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f1f3f7] text-[#9ca3af]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
                    {r.status ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors" title="Ver">
                      <EyeIcon />
                    </button>
                    <button className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors" title="Editar">
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmRule(r.id)}
                      className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                        r.status
                          ? "text-[#dc2626] hover:bg-[#fef2f2]"
                          : "text-[#16a34a] hover:bg-[#dcfce7]"
                      }`}
                    >
                      {r.status ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <RuleFormModal onClose={() => setShowModal(false)} />}

      {/* Confirm modal */}
      {confirmRule && ruleToConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-sm shadow-xl p-6">
            <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5">
                <path d="M8 3v5M8 11v1" />
                <circle cx="8" cy="8" r="7" />
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-[#0f1117] font-display mb-1">
              ¿Deseas {ruleToConfirm.status ? "desactivar" : "activar"} esta regla?
            </h3>
            <p className="text-[13px] text-[#6b7280] mb-5">
              {ruleToConfirm.status
                ? "La regla dejará de aplicarse en el cálculo de precios, pero conservará su configuración."
                : "La regla comenzará a aplicarse en el próximo cálculo de precios."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmRule(null)} className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => toggleStatus(confirmRule)}
                className={`px-4 py-2 text-[13px] font-semibold text-white rounded-[6px] transition-colors ${
                  ruleToConfirm.status ? "bg-[#dc2626] hover:bg-[#b91c1c]" : "bg-[#16a34a] hover:bg-[#15803d]"
                }`}
              >
                {ruleToConfirm.status ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}
