import { useState } from "react";

const CATEGORIES = ["Suscripciones", "Envíos", "Entradas", "Almacenamiento", "Soporte"];

export default function ProductFormModal({ onClose }: { onClose: () => void }) {
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState({
    sku: "SUB-NUE-009",
    name: "",
    category: "",
    base: "",
    min: "",
    max: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e6ed]">
          <h2 className="text-[16px] font-bold text-[#0f1117] font-display">Registrar producto</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        {/* Form toggle */}
        <div className="px-6 pt-4 pb-1 flex gap-2">
          <button
            onClick={() => setShowErrors(false)}
            className={`text-[12px] font-medium px-3 py-1 rounded-full transition-colors ${!showErrors ? "bg-[#1a56db] text-white" : "text-[#6b7280] hover:bg-[#f1f3f7]"}`}
          >
            Sin errores
          </button>
          <button
            onClick={() => setShowErrors(true)}
            className={`text-[12px] font-medium px-3 py-1 rounded-full transition-colors ${showErrors ? "bg-[#dc2626] text-white" : "text-[#6b7280] hover:bg-[#f1f3f7]"}`}
          >
            Con errores
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* SKU */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">SKU</label>
            <input
              type="text"
              value={showErrors ? "SUB-PRE-001" : form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="Ej. PRD-001"
              className={`w-full px-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                showErrors ? "border-[#dc2626] focus:ring-[#dc2626]/20" : "border-[#e2e6ed] focus:ring-[#1a56db] focus:border-transparent"
              } placeholder-[#9ca3af] text-[#0f1117]`}
            />
            {showErrors && (
              <p className="mt-1 text-[11px] text-[#dc2626]">El SKU ya se encuentra registrado.</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ej. Suscripción Premium Mensual"
              className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent placeholder-[#9ca3af] text-[#0f1117]"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]"
            >
              <option value="">Seleccionar categoría…</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Precio base</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">$</span>
                <input type="number" placeholder="29.900" className="w-full pl-6 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af]" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Precio mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">$</span>
                <input
                  type="number"
                  placeholder="24.900"
                  defaultValue={showErrors ? "50000" : ""}
                  className={`w-full pl-6 pr-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                    showErrors ? "border-[#dc2626] focus:ring-[#dc2626]/20" : "border-[#e2e6ed] focus:ring-[#1a56db]"
                  } placeholder-[#9ca3af]`}
                />
              </div>
              {showErrors && (
                <p className="mt-1 text-[11px] text-[#dc2626]">El precio mínimo debe ser menor al precio máximo.</p>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Precio máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">$</span>
                <input type="number" placeholder="39.900" className="w-full pl-6 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e6ed] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
            Cancelar
          </button>
          <button className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
