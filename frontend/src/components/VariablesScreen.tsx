import { useEffect, useState } from "react";

type VariableType = "DEMANDA" | "DISPONIBILIDAD" | "TEMPORAL";
type VariableLevel = "CRITICO" | "BAJO" | "NORMAL" | "ALTO";
type TimeConditionType = "HORA_PICO" | "TEMPORADA_ALTA";

interface BusinessVariable {
  id?: number;
  variableType: VariableType;
  level: VariableLevel;
  timeCondition?: TimeConditionType | null;
  updatedAt?: string;
}

interface PriceCalculationResult {
  productId: number;
  basePrice: number;
  finalPrice: number;
  clampedToMax: boolean;
  clampedToMin: boolean;
  appliedRuleIds: number[];
  calculatedAt: string;
}

const API_BASE = "/api";

const VARIABLE_TYPES: VariableType[] = ["DEMANDA", "DISPONIBILIDAD", "TEMPORAL"];
const LEVELS: VariableLevel[] = ["CRITICO", "BAJO", "NORMAL", "ALTO"];
const TIME_CONDITIONS: TimeConditionType[] = ["HORA_PICO", "TEMPORADA_ALTA"];

export default function VariablesScreen() {
  const [variables, setVariables] = useState<BusinessVariable[]>([]);
  const [form, setForm] = useState<BusinessVariable>({
    variableType: "DEMANDA",
    level: "NORMAL",
    timeCondition: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [productId, setProductId] = useState<string>("");
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const loadVariables = async () => {
    try {
      const res = await fetch(`${API_BASE}/variables`);
      if (!res.ok) throw new Error("No se pudieron cargar las variables");
      setVariables(await res.json());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    loadVariables();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/variables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al guardar la variable");
      }
      setSuccess("Variable configurada correctamente.");
      await loadVariables();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCalculate = async () => {
    setPriceError(null);
    setPriceResult(null);
    if (!productId) {
      setPriceError("Ingresa el ID del producto.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/price`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "No se pudo calcular el precio");
      }
      setPriceResult(await res.json());
    } catch (e) {
      setPriceError((e as Error).message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-6">
        Variables de negocio y motor de precios
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#e2e6ed] rounded-[8px] p-5">
          <h2 className="text-[15px] font-semibold text-[#0f1117] mb-4">
            Configurar variable (HU10)
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-[#374151]">Variable</label>
              <select
                className="w-full border border-[#e2e6ed] rounded-[6px] px-3 py-2 text-[13px]"
                value={form.variableType}
                onChange={(e) =>
                  setForm({ ...form, variableType: e.target.value as VariableType, timeCondition: null })
                }
              >
                {VARIABLE_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#374151]">Nivel</label>
              <select
                className="w-full border border-[#e2e6ed] rounded-[6px] px-3 py-2 text-[13px]"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as VariableLevel })}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {form.variableType === "TEMPORAL" && (
              <div>
                <label className="text-[12px] font-medium text-[#374151]">Condicion temporal</label>
                <select
                  className="w-full border border-[#e2e6ed] rounded-[6px] px-3 py-2 text-[13px]"
                  value={form.timeCondition ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, timeCondition: e.target.value as TimeConditionType })
                  }
                >
                  <option value="">Selecciona...</option>
                  {TIME_CONDITIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="text-[12px] text-red-600">{error}</p>}
            {success && <p className="text-[12px] text-green-600">{success}</p>}

            <button
              type="submit"
              className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors"
            >
              Guardar variable
            </button>
          </form>

          <div className="mt-5">
            <h3 className="text-[13px] font-semibold text-[#374151] mb-2">Variables configuradas</h3>
            <ul className="space-y-1">
              {variables.map((v) => (
                <li key={v.variableType} className="text-[12px] text-[#374151]">
                  {v.variableType}: {v.level}{v.timeCondition ? ` (${v.timeCondition})` : ""}
                </li>
              ))}
              {variables.length === 0 && (
                <li className="text-[12px] text-[#9ca3af]">Aun no hay variables configuradas.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-[8px] p-5">
          <h2 className="text-[15px] font-semibold text-[#0f1117] mb-4">
            Calcular precio final (HU12)
          </h2>

          <div className="flex items-end gap-2 mb-4">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-[#374151]">ID del producto</label>
              <input
                className="w-full border border-[#e2e6ed] rounded-[6px] px-3 py-2 text-[13px]"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Ej: 1"
              />
            </div>
            <button
              onClick={handleCalculate}
              className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors"
            >
              Calcular
            </button>
          </div>

          {priceError && <p className="text-[12px] text-red-600 mb-2">{priceError}</p>}

          {priceResult && (
            <div className="text-[13px] text-[#374151] space-y-1">
              <p>Precio base: {priceResult.basePrice}</p>
              <p className="font-semibold">Precio final: {priceResult.finalPrice}</p>
              <p>Reglas aplicadas: {priceResult.appliedRuleIds.join(", ") || "ninguna"}</p>
              {priceResult.clampedToMax && (
                <p className="text-amber-600">Se acoto al precio maximo del producto.</p>
              )}
              {priceResult.clampedToMin && (
                <p className="text-amber-600">Se acoto al precio minimo del producto.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
