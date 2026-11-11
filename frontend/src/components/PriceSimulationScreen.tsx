import { useEffect, useMemo, useState } from "react";
import {
  API_URL,
  fetchPricingRules,
  simulatePrices,
  type ApiPricingRule,
  type ApiSimulationResult,
  type SimulationRuleDraft,
} from "../api/client";
import { apiFetch } from "../api/http";
import RestrictedButton from "../auth/RestrictedButton";
import LoadingScreen from "./LoadingScreen";
import type { ApiProduct } from "./ProductFormModal";
import { VARIABLE_CONFIG, type VariableKey } from "./RuleFormModal";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const pct = (from: number, to: number) => (from ? ((to - from) / from) * 100 : 0);
const ruleCode = (id: number) => `RGL-${String(id).padStart(3, "0")}`;

function conditionLabel(rule: Pick<ApiPricingRule, "variableType" | "level" | "timeCondition">): string {
  const config = VARIABLE_CONFIG[rule.variableType];
  const value = rule.variableType === "TEMPORAL" ? rule.timeCondition : rule.level;
  const option = config.options.find((o) => o.value === value);
  return `${config.label} = ${option?.label ?? value ?? "—"}`;
}

function effectLabel(rule: Pick<ApiPricingRule, "effectType" | "effectValue">): string {
  const sign = rule.effectValue >= 0 ? "+" : "−";
  const abs = Math.abs(rule.effectValue);
  return rule.effectType === "PORCENTAJE" ? `${sign}${abs}%` : `${sign}$${abs.toLocaleString("es-CL")}`;
}

type RuleMode = "existing" | "new";
type FieldErrors = { rule?: string; effectValue?: string; products?: string };

const inputBase = "w-full px-3 py-2 text-[13px] bg-white border rounded-[6px] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db]";
const inputBorder = (hasError: boolean) => (hasError ? "border-[#dc2626] bg-[#fef2f2]" : "border-[#e2e6ed]");

/* ------------------------------------------------------------------ */
/*  Pantalla                                                           */
/* ------------------------------------------------------------------ */

/** HU13: módulo de simulación. Calcula precios hipotéticos sin modificar el precio real ni el historial. */
export default function PriceSimulationScreen({ initialRuleId }: { initialRuleId?: number | null }) {
  const [rules, setRules] = useState<ApiPricingRule[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<RuleMode>("existing");
  const [ruleId, setRuleId] = useState<number | "">(initialRuleId ?? "");
  const [variableType, setVariableType] = useState<VariableKey>("DEMANDA");
  const [conditionValue, setConditionValue] = useState(VARIABLE_CONFIG.DEMANDA.options[0].value);
  const [effectType, setEffectType] = useState<"PORCENTAJE" | "VALOR">("PORCENTAJE");
  const [effectValue, setEffectValue] = useState("10");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSimulationResult | null>(null);
  // Descripción de la regla tal como estaba al simular (el formulario puede cambiar después)
  const [resultRuleLabel, setResultRuleLabel] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [rulesData, productsRes] = await Promise.all([fetchPricingRules(), apiFetch(`${API_URL}/api/products`)]);
        if (!productsRes.ok) throw new Error();
        const productsData: ApiProduct[] = await productsRes.json();
        setRules(rulesData);
        setProducts(productsData);
        // Si se llegó desde una regla, se precargan sus productos
        const initial = rulesData.find((r) => r.id === initialRuleId);
        if (initial) {
          const existing = new Set(productsData.map((p) => p.id));
          setSelectedIds((initial.productIds ?? []).filter((id) => existing.has(id)));
        }
      } catch {
        setLoadError("No se pudieron cargar las reglas y los productos. Verifica que el backend esté corriendo.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [initialRuleId]);

  const selectedRule = rules.find((r) => r.id === ruleId);
  // El selector lista las reglas por código (RGL-001, RGL-002, …)
  const rulesByCode = useMemo(() => [...rules].sort((a, b) => a.id - b.id), [rules]);
  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ApiProduct => !!p);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
      .slice(0, 6);
  }, [search, products, selectedIds]);

  const chooseRule = (id: number | "") => {
    setRuleId(id);
    setErrors((e) => ({ ...e, rule: undefined }));
    // Comodidad: si aún no hay productos elegidos, se proponen los de la regla
    const rule = rules.find((r) => r.id === id);
    if (rule && selectedIds.length === 0) {
      setSelectedIds((rule.productIds ?? []).filter((pid) => products.some((p) => p.id === pid)));
      setErrors((e) => ({ ...e, products: undefined }));
    }
  };

  const handleSimulate = async () => {
    // Datos incompletos: se resaltan los campos y no se ejecuta la simulación
    const next: FieldErrors = {};
    if (mode === "existing" && ruleId === "") next.rule = "Selecciona una regla.";
    if (mode === "new" && (effectValue.trim() === "" || !Number.isFinite(Number(effectValue)))) {
      next.effectValue = "Ingresa un valor numérico para el efecto.";
    }
    if (selectedIds.length === 0) next.products = "Selecciona al menos un producto.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const draft: SimulationRuleDraft | undefined =
      mode === "new"
        ? {
            variableType,
            level: variableType === "TEMPORAL" ? undefined : (conditionValue as ApiPricingRule["level"]),
            timeCondition: variableType === "TEMPORAL" ? (conditionValue as ApiPricingRule["timeCondition"]) : undefined,
            effectType,
            effectValue: Number(effectValue),
          }
        : undefined;

    setSimulating(true);
    setSimError(null);
    try {
      const data = await simulatePrices({
        ruleId: mode === "existing" ? Number(ruleId) : undefined,
        rule: draft,
        productIds: selectedIds,
      });
      setResult(data);
      setResultRuleLabel(
        mode === "existing" && selectedRule
          ? `${ruleCode(selectedRule.id)} · ${conditionLabel(selectedRule)} · ${effectLabel(selectedRule)}`
          : `Regla nueva · ${conditionLabel(draft!)} · ${effectLabel(draft!)}`
      );
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "No se pudo ejecutar la simulación.");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Cargando simulador…" />;
  }
  if (loadError) {
    return <LoadingScreen label="No se pudo cargar el simulador" error={loadError} />;
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Simulación de precios</h1>
        <SimulationBadge />
        <HelpTip align="left" label="Qué es una simulación">
          Los resultados son hipotéticos: no cambian el precio real de los productos ni crean registros en el historial
          de precios.
        </HelpTip>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-[#e2e6ed] rounded-[10px] p-6 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Regla */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-bold text-[#0f1117]">1. Regla</h2>
              <div className="inline-flex p-0.5 bg-[#f1f3f7] rounded-[6px] text-[12px]" role="tablist">
                {(["existing", "new"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m);
                      setErrors((e) => ({ ...e, rule: undefined, effectValue: undefined }));
                    }}
                    className={`px-3 py-1 rounded-[5px] font-semibold transition-colors ${
                      mode === m ? "bg-white text-[#1a56db] shadow-sm" : "text-[#6b7280] hover:text-[#0f1117]"
                    }`}
                  >
                    {m === "existing" ? "Existente" : "Nueva"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "existing" ? (
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Regla a simular</label>
                <select
                  value={ruleId}
                  onChange={(e) => chooseRule(e.target.value === "" ? "" : Number(e.target.value))}
                  aria-invalid={!!errors.rule}
                  className={`${inputBase} ${inputBorder(!!errors.rule)}`}
                >
                  <option value="">Selecciona una regla…</option>
                  {rulesByCode.map((r) => (
                    <option key={r.id} value={r.id}>
                      {ruleCode(r.id)} · {conditionLabel(r)} · {effectLabel(r)}
                      {r.ruleStatus === "INACTIVE" ? " (inactiva)" : ""}
                    </option>
                  ))}
                </select>
                {errors.rule && <p className="mt-1 text-[11px] text-[#dc2626]">{errors.rule}</p>}
                {selectedRule?.ruleStatus === "INACTIVE" && (
                  <p className="mt-1.5 text-[11px] text-[#6b7280]">
                    La regla está inactiva: se simula como si estuviera activa.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Variable</label>
                    <select
                      value={variableType}
                      onChange={(e) => {
                        const value = e.target.value as VariableKey;
                        setVariableType(value);
                        setConditionValue(VARIABLE_CONFIG[value].options[0].value);
                      }}
                      className={`${inputBase} ${inputBorder(false)}`}
                    >
                      {Object.entries(VARIABLE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Condición</label>
                    <select
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      className={`${inputBase} ${inputBorder(false)}`}
                    >
                      {VARIABLE_CONFIG[variableType].options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Tipo de efecto</label>
                    <select
                      value={effectType}
                      onChange={(e) => setEffectType(e.target.value as "PORCENTAJE" | "VALOR")}
                      className={`${inputBase} ${inputBorder(false)}`}
                    >
                      <option value="PORCENTAJE">Porcentaje</option>
                      <option value="VALOR">Monto fijo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                      Valor {effectType === "PORCENTAJE" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      value={effectValue}
                      onChange={(e) => {
                        setEffectValue(e.target.value);
                        setErrors((er) => ({ ...er, effectValue: undefined }));
                      }}
                      aria-invalid={!!errors.effectValue}
                      className={`${inputBase} ${inputBorder(!!errors.effectValue)}`}
                    />
                    {errors.effectValue && <p className="mt-1 text-[11px] text-[#dc2626]">{errors.effectValue}</p>}
                  </div>
                </div>
                <p className="text-[11px] text-[#9ca3af]">Usa un valor negativo para simular un descuento. La regla no se guarda.</p>
              </div>
            )}
          </section>

          {/* 2. Productos */}
          <section>
            <h2 className="text-[13px] font-bold text-[#0f1117] mb-3">2. Productos</h2>
            <label className="block text-[11px] font-semibold text-[#374151] mb-1">Uno o más productos</label>
            <div className={`border rounded-[6px] p-2.5 ${errors.products ? "border-[#dc2626] bg-[#fef2f2]" : "border-[#e2e6ed]"}`}>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
                {selectedProducts.map((p) => (
                  <span key={p.id} className="px-2 py-0.5 bg-[#e8f0fd] text-[#1a56db] text-[11px] rounded-full flex items-center">
                    {p.name}
                    <button
                      onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== p.id))}
                      aria-label={`Quitar ${p.name}`}
                      className="ml-1.5 font-bold hover:text-[#dc2626]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedProducts.length === 0 && <span className="text-[12px] text-[#9ca3af]">Ningún producto seleccionado</span>}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU o nombre…"
                className="w-full text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
              {suggestions.length > 0 && (
                <div className="mt-1 bg-white border border-[#e2e6ed] rounded-[6px] max-h-44 overflow-y-auto">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedIds((ids) => [...ids, p.id]);
                        setSearch("");
                        setErrors((e) => ({ ...e, products: undefined }));
                      }}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f1f3f7] border-b border-[#f1f3f7] last:border-0"
                    >
                      {p.name} <span className="text-[#9ca3af] text-[11px] ml-2">{p.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.products && <p className="mt-1 text-[11px] text-[#dc2626]">{errors.products}</p>}
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="mt-1.5 text-[11px] font-semibold text-[#6b7280] hover:text-[#dc2626]"
              >
                Quitar todos
              </button>
            )}
          </section>
        </div>

        {simError && (
          <div className="mt-5 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">{simError}</div>
        )}

        <div className="flex justify-end mt-6">
          <RestrictedButton
            onClick={() => void handleSimulate()}
            disabled={simulating}
            className="flex items-center gap-2 px-5 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors disabled:opacity-60"
          >
            <PlayIcon />
            {simulating ? "Simulando…" : "Simular"}
          </RestrictedButton>
        </div>
      </div>

      {/* Resultado */}
      {result && <SimulationResultTable result={result} ruleLabel={resultRuleLabel} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Piezas                                                             */
/* ------------------------------------------------------------------ */

function SimulationResultTable({ result, ruleLabel }: { result: ApiSimulationResult; ruleLabel: string }) {
  const seconds = (result.elapsedMs / 1000).toLocaleString("es-CO", { maximumFractionDigits: 2 });
  const at = new Date(result.simulatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-[8px]" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#e2e6ed]">
        <div className="min-w-0 truncate" title={ruleLabel}>
          <span className="text-[14px] font-semibold text-[#0f1117]">Resultado</span>
          <span className="ml-1.5 text-[12px] text-[#6b7280]">· {ruleLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#9ca3af]">
            {result.products.length} {result.products.length === 1 ? "producto" : "productos"} · {seconds} s · {at}
          </span>
          <HelpTip align="right" label="Qué significan las etiquetas">
            <p>
              <strong className="text-[#0f1117]">(tope máx.) / (tope mín.)</strong>: el cálculo superó el rango del
              producto y el precio se acotó a su límite.
            </p>
            <p className="mt-1.5">
              <strong className="text-[#0f1117]">Sin cambios</strong>: la condición de la regla no se cumple hoy para el
              producto, o el producto está inactivo.
            </p>
          </HelpTip>
        </div>
      </div>

      <div className="overflow-x-auto rounded-b-[8px]">
        <table className="w-full min-w-[620px] text-[13px]">
          <thead>
            <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
              <th className="text-left px-5 py-3">Producto</th>
              <th className="text-right px-4 py-3">Precio actual</th>
              <th className="text-right px-4 py-3">Precio simulado</th>
              <th className="text-right px-5 py-3">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {result.products.map((p) => {
              const diff = pct(p.currentPrice, p.simulatedPrice);
              const unchanged = !p.productActive || !p.ruleApplied || diff === 0;
              return (
                <tr key={p.productId} className="border-b border-[#f1f3f7] last:border-b-0 hover:bg-[#f8f9fb] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#0f1117]">{p.productName}</div>
                    <div className="font-mono text-[11px] text-[#9ca3af]">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b7280] whitespace-nowrap">{fmt(p.currentPrice)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.ruleApplied && (p.clampedToMax || p.clampedToMin) && (
                      <span
                        className="mr-1.5 text-[11px] font-medium text-[#b45309]"
                        title={`El cálculo dio ${fmt(p.calculatedPrice)}`}
                      >
                        {p.clampedToMax ? "(tope máx.)" : "(tope mín.)"}
                      </span>
                    )}
                    <span className="font-semibold text-[#0f1117]">{fmt(p.simulatedPrice)}</span>
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                    unchanged ? "text-[#9ca3af]" : diff > 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                  }`}>
                    {unchanged ? "Sin cambios" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimulationBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f1f3f7] border border-[#e2e6ed] text-[#374151] text-[11px] font-semibold whitespace-nowrap">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6L4.5 18.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" />
      </svg>
      Simulación
    </span>
  );
}

/** Icono "?" que muestra una explicación breve al pasar el cursor o al enfocarlo con el teclado. */
function HelpTip({ label, align, children }: { label: string; align: "left" | "right"; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={label}
        className="w-5 h-5 rounded-full border border-[#d1d5db] text-[11px] font-semibold text-[#6b7280] hover:border-[#1a56db] hover:text-[#1a56db] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition-colors"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute z-20 top-7 ${
          align === "left" ? "left-0" : "right-0"
        } w-64 px-3 py-2.5 bg-white border border-[#e2e6ed] rounded-[8px] shadow-lg text-[12px] font-normal leading-relaxed text-[#6b7280]`}
      >
        {children}
      </span>
    </span>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}
