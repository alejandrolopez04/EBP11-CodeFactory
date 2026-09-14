import { useState } from "react";

const SELECTED_PRODUCTS = ["Suscripción Premium Mensual", "Envío Express 24h", "Entrada VIP Evento"];

export default function RuleFormModal({ onClose }: { onClose: () => void }) {
  const [showWarning, setShowWarning] = useState(false);
  const [variable, setVariable] = useState("Demanda");
  const [operator, setOperator] = useState("Mayor que");
  const [value, setValue] = useState("Alta");
  const [effectType, setEffectType] = useState("Porcentaje");
  const [effectValue, setEffectValue] = useState("15");
  const [chips, setChips] = useState(SELECTED_PRODUCTS);
  const [search, setSearch] = useState("");

  const removeChip = (p: string) => setChips((c) => c.filter((x) => x !== p));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e6ed]">
          <h2 className="text-[16px] font-bold text-[#0f1117] font-display">Crear regla de ajuste</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWarning(!showWarning)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${showWarning ? "bg-amber-100 border-amber-300 text-amber-700" : "border-[#e2e6ed] text-[#6b7280] hover:bg-[#f1f3f7]"}`}
            >
              {showWarning ? "Ocultar aviso" : "Mostrar aviso"}
            </button>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Condición */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Condición</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Variable</label>
                <select value={variable} onChange={(e) => setVariable(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]">
                  <option>Demanda</option>
                  <option>Disponibilidad</option>
                  <option>Horario</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Operador</label>
                <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]">
                  <option>Mayor que</option>
                  <option>Menor que</option>
                  <option>Igual a</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Valor</label>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ej. Alta" className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af] text-[#0f1117]" />
              </div>
            </div>
          </section>

          {/* Efecto */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Efecto</h3>
            <div className="flex gap-3">
              <div className="w-40">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Tipo</label>
                <select value={effectType} onChange={(e) => setEffectType(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]">
                  <option>Porcentaje</option>
                  <option>Monto fijo</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">
                    {effectType === "Porcentaje" ? "%" : "$"}
                  </span>
                  <input type="number" value={effectValue} onChange={(e) => setEffectValue(e.target.value)} className="w-full pl-7 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#0f1117]" />
                </div>
              </div>
            </div>
          </section>

          {/* Productos asociados */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Productos asociados</h3>
            <div className="border border-[#e2e6ed] rounded-[6px] p-3 min-h-[60px]">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {chips.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f0fd] text-[#1a56db] text-[11px] font-medium rounded-full">
                    {p}
                    <button onClick={() => removeChip(p)} className="text-[#1a56db]/60 hover:text-[#1a56db] ml-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 2l6 6M8 2L2 8" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar y agregar productos…"
                className="w-full text-[13px] text-[#0f1117] placeholder-[#9ca3af] focus:outline-none"
              />
            </div>
          </section>
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="mx-6 mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-[6px]">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
            <p className="text-[12px] text-amber-800">
              El efecto configurado generaría un precio fuera del rango permitido para <strong>"Suscripción Básica Mensual"</strong>. Ajusta el efecto o los límites del producto.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e6ed] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
            Cancelar
          </button>
          <button className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors">
            Guardar regla
          </button>
        </div>
      </div>
    </div>
  );
}
