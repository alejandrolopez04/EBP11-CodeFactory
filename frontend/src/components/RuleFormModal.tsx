import { useEffect, useMemo, useState } from "react";
import { API_URL, updatePricingRule, type ApiPricingRule } from "../api/client";
import { apiFetch } from "../api/http";



const RULES_API_URL = `${API_URL}/api/pricing_rules`;
const PRODUCTS_API_URL = `${API_URL}/api/products`;

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
  editingRule?: ApiPricingRule | null;
  onClose: () => void;
  onSaved?: (message: string) => void | Promise<void>;
}

function toLocalInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function RuleFormModal({ editingRule, onClose, onSaved }: RuleFormModalProps) {
  const isEditing = Boolean(editingRule);

  const [variableType, setVariableType] = useState<VariableKey>("DEMANDA");
  const [conditionValue, setConditionValue] = useState("BAJO");
  const [effectType, setEffectType] = useState<"PORCENTAJE" | "VALOR">("PORCENTAJE");
  const [effectValue, setEffectValue] = useState("15");

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState("");

  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar todos los productos para el buscador
  useEffect(() => {
    apiFetch(PRODUCTS_API_URL)
      .then((response) => response.json())
      .then((data: ApiProduct[]) => setAllProducts(data))
      .catch(() => setError("No se pudieron cargar los productos."));
  }, []);

  // 2. Precargar datos si estamos editando
  useEffect(() => {
    if (!editingRule) return;

    setVariableType(editingRule.variableType);
    setConditionValue(
      editingRule.variableType === "TEMPORAL"
        ? editingRule.timeCondition ?? "HORA_PICO"
        : editingRule.level ?? "NORMAL"
    );
    setEffectType(editingRule.effectType);
    setEffectValue(String(editingRule.effectValue));
    setValidFrom(toLocalInput(editingRule.validFrom));
    setValidTo(toLocalInput(editingRule.validTo));

    // NOTA: Si tu ApiPricingRule trae los productos como un array de IDs (productIds)
    // filtramos "allProducts" para mostrarlos en las etiquetas.
    // Si el backend te trae el objeto completo, puedes asignarlo directo.
    if (editingRule.productIds && allProducts.length > 0) {
      const ruleProducts = allProducts.filter(p => editingRule.productIds?.includes(p.id));
      setSelectedProducts(ruleProducts);
    }
  }, [editingRule, allProducts]); // Incluimos allProducts para que espere a que carguen

  const currentConfig = VARIABLE_CONFIG[variableType];

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const selectedIds = new Set(selectedProducts.map((product) => product.id));

    return allProducts
      .filter((product) => !selectedIds.has(product.id))
      .filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.sku.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 6);
  }, [search, allProducts, selectedProducts]);

  const handleSubmit = async () => {
    setError(null);

    if (!effectValue || !Number.isFinite(Number(effectValue))) {
      setError("El valor del efecto debe ser un número válido.");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Selecciona al menos un producto.");
      return;
    }

    if (!validFrom || !validTo || new Date(validFrom) >= new Date(validTo)) {
      setError("La fecha Desde debe ser anterior a la fecha Hasta.");
      return;
    }

    setLoading(true);

    try {
      // Payload unificado para Crear y Editar
      const payload = {
        variableType,
        level: variableType === "TEMPORAL" ? undefined : conditionValue as ApiPricingRule["level"],
        timeCondition: variableType === "TEMPORAL" ? conditionValue as ApiPricingRule["timeCondition"] : undefined,
        effectType,
        effectValue: Number(effectValue),
        productIds: selectedProducts.map((product) => product.id),
        validFrom,
        validTo,
      };

      if (isEditing && editingRule) {
        // Aseguramos que updatePricingRule acepte estos campos (esto se ajusta en api/client.ts si es necesario)
        await updatePricingRule(editingRule.id, payload);
        await onSaved?.("Regla actualizada exitosamente.");
      } else {
        const response = await apiFetch(RULES_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.message || "No se pudo crear la regla.");
          return;
        }

        await onSaved?.("Regla creada exitosamente.");
      }

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e6ed]">
          <h2 className="text-[16px] font-bold text-[#0f1117]">
            {isEditing ? "Editar regla de ajuste" : "Crear regla de ajuste"}
          </h2>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
            {error}
          </div>
        )}

        <div className="px-6 py-5 space-y-6">
          {/* SECCIÓN CONDICIÓN */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase mb-3">Condición</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Variable</label>
                <select
                  value={variableType}
                  onChange={(event) => {
                    const value = event.target.value as VariableKey;
                    setVariableType(value);
                    setConditionValue(VARIABLE_CONFIG[value].options[0].value);
                  }}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                >
                  {Object.entries(VARIABLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Valor</label>
                <select
                  value={conditionValue}
                  onChange={(event) => setConditionValue(event.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                >
                  {currentConfig.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* SECCIÓN EFECTO */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase mb-3">Efecto</h3>
            <div className="flex gap-3">
              <div className="w-40">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Tipo</label>
                <select
                  value={effectType}
                  onChange={(event) => setEffectType(event.target.value as "PORCENTAJE" | "VALOR")}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                >
                  <option value="PORCENTAJE">Porcentaje</option>
                  <option value="VALOR">Monto fijo</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Valor</label>
                <input
                  type="number"
                  value={effectValue}
                  onChange={(event) => setEffectValue(event.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN VIGENCIA (Ahora siempre visible y editable) */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase mb-3">Vigencia</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Desde</label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(event) => setValidFrom(event.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Hasta</label>
                <input
                  type="datetime-local"
                  value={validTo}
                  onChange={(event) => setValidTo(event.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px]"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN PRODUCTOS (Ahora siempre visible y editable) */}
          <section>
            <h3 className="text-[11px] font-bold text-[#6b7280] uppercase mb-3">Productos asociados</h3>
            <div className="border border-[#e2e6ed] rounded-[6px] p-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedProducts.map((product) => (
                  <span key={product.id} className="px-2 py-0.5 bg-[#e8f0fd] text-[#1a56db] text-[11px] rounded-full flex items-center">
                    {product.name}
                    <button
                      onClick={() =>
                        setSelectedProducts((previous) =>
                          previous.filter((item) => item.id !== product.id)
                        )
                      }
                      className="ml-1.5 font-bold hover:text-[#dc2626]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedProducts.length === 0 && (
                  <span className="text-[12px] text-[#9ca3af]">Ningún producto seleccionado</span>
                )}
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full text-[13px] border border-[#e2e6ed] rounded-[6px] px-3 py-2"
              />

              {suggestions.length > 0 && (
                <div className="mt-1 bg-white border border-[#e2e6ed] rounded-[6px] max-h-40 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProducts((previous) => [...previous, product]);
                        setSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f1f3f7] border-b border-[#f1f3f7] last:border-0"
                    >
                      {product.name} <span className="text-[#9ca3af] text-[11px] ml-2">{product.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-[#e2e6ed] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] disabled:opacity-50 hover:bg-[#1648c0] transition-colors"
          >
            {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear regla"}
          </button>
        </div>
      </div>
    </div>
  );
}