import { useState } from "react";

const CATEGORIES = ["Suscripciones", "Envíos", "Entradas", "Almacenamiento", "Soporte"];

const API_URL = "http://localhost:8080/api/products";

interface ProductFormModalProps {
  onClose: () => void;
  onProductCreated?: () => void;
}


export default function ProductFormModal({ onClose, onProductCreated }: ProductFormModalProps) {
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    base: "",
    min: "",
    max: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.sku || !form.name || !form.category || !form.base || !form.min || !form.max) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (parseFloat(form.base) <= 0) {
      setError("El precio base debe ser mayor a cero.")
      return;
    }

    if (parseFloat(form.min) <= 0) {
      setError("El precio mínimo debe ser mayor a cero.")
      return;
    }

    if (parseFloat(form.max) <= 0) {
      setError("El precio máximo debe ser mayor a cero.")
      return;
    }

    if (parseFloat(form.min) >= parseFloat(form.max)) {
      setError("El precio mínimo debe ser menor que el precio máximo.")
      return;
    }



    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          category: form.category,
          basePrice: Number(form.base),
          minPrice: Number(form.min),
          maxPrice: Number(form.max),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || "No se pudo registrar el producto. Verifica los datos.";
        setError(message);
        return;
      }
      onProductCreated?.();
      onClose();
    } catch (err) {
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

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

        {error && (
            <div className="mx-6 mt-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
              {error}
            </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* SKU */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="Ej. PRD-001"
              className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent placeholder-[#9ca3af] text-[#0f1117]"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
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
                <input
                    type="number"
                    value={form.base}
                    onChange= {(e)=>update("base",e.target.value)}
                    className="w-full pl-6 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af]" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Precio mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">$</span>
                <input // precio mínimo
                  type="number"
                  value= {form.min}
                  onChange={(e)=>update("min", e.target.value)}
                  className="w-full pl-6 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Precio máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">$</span>
                <input // precio máximo
                    type="number"
                    value= {form.max}
                    onChange={(e)=>update("max", e.target.value)}
                    className="w-full pl-6 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] placeholder-[#9ca3af]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e6ed] flex items-center justify-end gap-3">
          <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
            Cancelar
          </button>
          <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
