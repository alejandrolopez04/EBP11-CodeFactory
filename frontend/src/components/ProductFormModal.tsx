import { useState } from "react";

const CATEGORIES = ["Suscripciones", "Envíos", "Entradas", "Almacenamiento", "Soporte"];

const API_URL = "http://localhost:8080/api/products";

export interface ApiProduct {
  id: number; sku: string; name: string; category: string;
  basePrice: number; minPrice: number; maxPrice: number; productAvailability:
  number; productDemand: number; productStatus: "ACTIVE" | "INACTIVE";
}

interface ProductFormModalProps {
  onClose: () => void;
  onProductCreated?: () => void;
  product?: ApiProduct;            // modo edición
  onProductUpdated?: () => void;
}


export default function ProductFormModal({ onClose, onProductCreated, product, onProductUpdated }: ProductFormModalProps) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "",
    productAvailability: product ? String(product.productAvailability): "",
    productDemand: product ? String(product.productDemand) : "",
    base: product ? String(product.basePrice) : "",
    min: product ? String(product.minPrice) : "",
    max: product ? String(product.maxPrice) : "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.sku || !form.name || !form.category || !form.productAvailability || !form.productDemand || !form.base || !form.min || !form.max) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const productAvailabilityNum = parseFloat(form.productAvailability);
    const productDemandNum = parseFloat(form.productDemand);
    if (isNaN(productAvailabilityNum) || productAvailabilityNum < 0 || productAvailabilityNum > 100) {
      setError("El Stock debe estar entre 0 y 100.");
      return;
    }
    if (isNaN(productDemandNum) || productDemandNum < 0 || productDemandNum > 100) {
      setError("La Demanda debe estar entre 0 y 100.");
      return;
    }

    if (parseFloat(form.base) <= 0) {
      setError("El precio base debe ser mayor a cero.")
      return;
    }

    if (parseFloat(form.base) < parseFloat(form.min)) {
      setError("El precio base debe estar entre el precio mínimo y máximo.")
      return;
    }

    if (parseFloat(form.base) > parseFloat(form.max)) {
      setError("El precio base debe estar entre el precio mínimo y máximo.")
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
      setError("El precio mínimo debe ser estrictamente menor al precio máximo.")
      return;
    }

    

    setLoading(true);
    try {
      const response = await fetch(isEdit ? `${API_URL}/${product!.id}`:API_URL, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          category: form.category,
          productAvailability: productAvailabilityNum,
          productDemand: productDemandNum,
          basePrice: Number(form.base),
          minPrice: Number(form.min),
          maxPrice: Number(form.max),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || (isEdit
            ? "No se pudo actualizar el producto. Verifica los datos."
            : "No se pudo registrar el producto. Verifica los datos.");
        setError(message);
        return;
      }
      if (isEdit) onProductUpdated?.();
      else onProductCreated?.();
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
          <h2 className="text-[16px] font-bold text-[#0f1117] font-display">{isEdit ? "Editar producto" : "Registrar producto"}</h2>
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
              {product && !CATEGORIES.includes(product.category) && (
                  <option>{product.category}</option>
              )}
            </select>
          </div>

          {/* Stock y Demanda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Stock (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.productAvailability}
                  onChange={(e) => update("productAvailability", e.target.value)}
                  placeholder="0 - 100"
                  className="w-full pl-3 pr-8 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent placeholder-[#9ca3af] text-[#0f1117]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Demanda (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.productDemand}
                  onChange={(e) => update("productDemand", e.target.value)}
                  placeholder="0 - 100"
                  className="w-full pl-3 pr-8 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent placeholder-[#9ca3af] text-[#0f1117]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">%</span>
              </div>
            </div>
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
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
