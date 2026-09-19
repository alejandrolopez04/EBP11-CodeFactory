import { useState, useEffect, useMemo } from "react";

const RULES_API_URL = "http://localhost:8080/api/pricing_rules";
const PRODUCTS_API_URL = "http://localhost:8080/api/products";

const VARIABLE_CONFIG = {
  DEMANDA: {
    label: "Demanda",
    field: "level" as const,
    options: [
      { value: "BAJO", label: "Baja" },
      { value: "NORMAL", label: "Media" },
      { value: "ALTO", label: "Alta" },
    ],
  },
  DISPONIBILIDAD: {
    label: "Disponibilidad",
    field: "level" as const,
    options: [
      { value: "CRITICO", label: "Crítico" },
      { value: "BAJO", label: "Bajo" },
      { value: "NORMAL", label: "Normal" },
    ],
  },
  TEMPORAL: {
    label: "Horario",
    field: "timeCondition" as const,
    options: [
      { value: "HORA_PICO", label: "Hora pico" },
      { value: "TEMPORADA_ALTA", label: "Temporada alta" },
    ],
  },
};

type VariableKey = keyof typeof VARIABLE_CONFIG;

interface ApiProduct {
  id: number;
  sku: string;
  name: string;
}

interface RuleFormModalProps {
  onClose: () => void;
  onRuleCreated?: () => void;
}

export default function RuleFormModal({ onClose, onRuleCreated }: RuleFormModalProps) {
  const [variableType, setVariableType] = useState<VariableKey>("DEMANDA");
  const [conditionValue, setConditionValue] = useState(VARIABLE_CONFIG.DEMANDA.options[0].value);

  const [effectType, setEffectType] = useState<"PORCENTAJE" | "VALOR">("PORCENTAJE");
  const [effectValue, setEffectValue] = useState("15");

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(PRODUCTS_API_URL)
        .then((res) => res.json())
        .then((data: ApiProduct[]) => setAllProducts(data))
        .catch(() => setError("No se pudieron cargar los productos disponibles."));
  }, []);

  const handleVariableChange = (v: VariableKey) => {
    setVariableType(v);
    setConditionValue(VARIABLE_CONFIG[v].options[0].value);
  };

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const selectedIds = new Set(selectedProducts.map((p) => p.id));
    return allProducts
        .filter((p) => !selectedIds.has(p.id))
        .filter(
            (p) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 6);
  }, [search, allProducts, selectedProducts]);

  const addProduct = (p: ApiProduct) => {
    setSelectedProducts((prev) => [...prev, p]);
    setSearch("");
  };

  const removeProduct = (id: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const currentConfig = VARIABLE_CONFIG[variableType];

  const handleSubmit = async () => {
    setError(null);

    if (!effectValue || Number(effectValue) == 0) {
      setError("El valor del efecto debe ser distinto de cero.");
      return;
    }
    if (selectedProducts.length === 0) {
      setError("Selecciona al menos un producto para asociar a la regla.");
      return;
    }

    const payload: Record<string, unknown> = {
      variableType,
      effectType,
      effectValue: Number(effectValue),
      productIds: selectedProducts.map((p) => p.id),
    };
    payload[currentConfig.field] = conditionValue;

    setLoading(true);
    try {
      const response = await fetch(RULES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message || "No se pudo registrar la regla. Verifica los datos.");
        return;
      }

      onRuleCreated?.();
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e6ed]">
          <h2 className="text-[16px] font-bold text-[#0f1117] font-display">Crear regla de ajuste</h2>
        </div>

        {error && (
            <div className="mx-6 mt-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
              {error}
            </div>
        )}
        <div className="px-6 py-5 space-y-6">
          {/* Condición */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Condición</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Variable</label>
                <select
                    value={variableType}
                    onChange={(e) => handleVariableChange(e.target.value as VariableKey)}
                    className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]"
                >
                  {Object.entries(VARIABLE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                  Es igual a
                </label>
                <select
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]"
                >
                  {currentConfig.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Efecto */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Efecto</h3>
            <div className="flex gap-3">
              <div className="w-40">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Tipo</label>
                <select value={effectType} onChange={(e) => setEffectType(e.target.value as "PORCENTAJE" | "VALOR")} className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#374151]">
                  <option value="PORCENTAJE">Porcentaje</option>
                  <option value="VALOR">Monto fijo</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">
                    {effectType === "PORCENTAJE" ? "%" : "$"}
                  </span>
                  <input type="number" value={effectValue} onChange={(e) => setEffectValue(e.target.value)} className="w-full pl-7 pr-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db] text-[#0f1117]" />
                </div>
              </div>
            </div>
          </section>

          {/* Productos asociados */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Productos asociados</h3>
            <div className="border border-[#e2e6ed] rounded-[6px] p-3 min-h-[60px] relative">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedProducts.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f0fd] text-[#1a56db] text-[11px] font-medium rounded-full">
                    {p.name}
                      <button onClick={() => removeProduct(p.id)} className="text-[#1a56db]/60 hover:text-[#1a56db] ml-0.5">
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
                  placeholder="Buscar por nombre o SKU…"
                  className="w-full text-[13px] text-[#0f1117] placeholder-[#9ca3af] focus:outline-none"
              />

              {/* Lista de sugerencias, aparece justo debajo del input mientras se escribe */}
              {suggestions.length > 0 && (
                  <div className="absolute left-3 right-3 mt-1 bg-white border border-[#e2e6ed] rounded-[6px] shadow-lg z-10 max-h-40 overflow-y-auto">
                    {suggestions.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f1f3f7] flex items-center justify-between"
                        >
                          <span className="text-[#0f1117]">{p.name}</span>
                          <span className="font-mono text-[11px] text-[#9ca3af]">{p.sku}</span>
                        </button>
                    ))}
                  </div>
              )}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-[#e2e6ed] flex items-center justify-end gap-3">
          <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar regla"}
          </button>
        </div>


        {/* Warning
        {showWarning && (
          <div className="mx-6 mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-[6px]">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
            <p className="text-[12px] text-amber-800">
              El efecto configurado generaría un precio fuera del rango permitido para <strong>"Suscripción Básica Mensual"</strong>. Ajusta el efecto o los límites del producto.
            </p>
          </div>
        )}*/}
      </div>
    </div>
  );
}
