import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Toast from "./Toast";
import type { ApiProduct } from "./ProductFormModal";
import {
  API_URL,
  fetchProductPrice,
  fetchRulesByProduct,
  prioritizeRules,
  type ApiPriceCalculation,
  type ApiPricingRule,
} from "../api/client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const VARIABLE_LABELS: Record<string, string> = {
  DEMANDA: "Demanda",
  DISPONIBILIDAD: "Disponibilidad",
  TEMPORAL: "Horario",
};
const LEVEL_LABELS: Record<string, string> = { CRITICO: "Crítico", BAJO: "Bajo", NORMAL: "Normal", ALTO: "Alto" };
const TIME_LABELS: Record<string, string> = { HORA_PICO: "Hora pico", TEMPORADA_ALTA: "Temporada alta" };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

function conditionText(rule: ApiPricingRule): string {
  const variable = VARIABLE_LABELS[rule.variableType] ?? rule.variableType;
  const value =
    rule.variableType === "TEMPORAL"
      ? TIME_LABELS[rule.timeCondition ?? ""] ?? rule.timeCondition
      : LEVEL_LABELS[rule.level ?? ""] ?? rule.level;
  return `${variable} = ${value ?? "—"}`;
}

function effectText(rule: ApiPricingRule): string {
  const sign = rule.effectValue >= 0 ? "+" : "−";
  const abs = Math.abs(rule.effectValue);
  return rule.effectType === "PORCENTAJE" ? `${sign}${abs}%` : `${sign}$${abs.toLocaleString("es-CL")}`;
}

const isExpired = (rule: ApiPricingRule) => !!rule.validTo && new Date(rule.validTo) <= new Date();

/** Determina si una regla está habilitada para aplicar en el cálculo */
const isPrioritizable = (rule: ApiPricingRule) => rule.ruleStatus === "ACTIVE" && !isExpired(rule);

const byPriority = (a: ApiPricingRule, b: ApiPricingRule) =>
  (a.priority ?? Infinity) - (b.priority ?? Infinity) || a.id - b.id;

/* ------------------------------------------------------------------ */
/*  Fila sortable                                                      */
/* ------------------------------------------------------------------ */

function SortableRuleRow({
  rule,
  position,
  met,
  isInactive,
  disabled,
}: {
  rule: ApiPricingRule;
  position: number;
  met: boolean;
  isInactive: boolean;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "#eef2ff" : undefined,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  const colorClass = !met ? "text-[#9ca3af]" : rule.effectValue >= 0 ? "text-[#16a34a]" : "text-[#dc2626]";
  const rowOpacity = isInactive ? "opacity-60 bg-[#fafafa] hover:bg-[#f4f5f7]" : "hover:bg-[#f8f9fb]";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#f1f3f7] last:border-b-0 transition-colors ${rowOpacity}`}
    >
      <td className="pl-3 pr-1 py-3 w-8">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reordenar regla"
          className="cursor-grab active:cursor-grabbing disabled:opacity-40 text-[#9ca3af] hover:text-[#1a56db] p-1 rounded transition-colors touch-none"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.2" />
            <circle cx="7.5" cy="2.5" r="1.2" />
            <circle cx="2.5" cy="7" r="1.2" />
            <circle cx="7.5" cy="7" r="1.2" />
            <circle cx="2.5" cy="11.5" r="1.2" />
            <circle cx="7.5" cy="11.5" r="1.2" />
          </svg>
        </button>
      </td>
      <td className="px-3 py-3 w-12 font-mono text-[12px] text-[#6b7280]">
        {position}
      </td>
      <td className="px-3 py-3 font-medium text-[#0f1117]">
        RGL-{String(rule.id).padStart(3, "0")}
        {isInactive && (
          <span className="ml-2 text-[10px] text-gray-500 font-normal border border-gray-200 bg-gray-100 px-1.5 py-0.5 rounded">
            No Aplica
          </span>
        )}
      </td>
      <td className="px-3 py-3 w-[26%]">
        <code className="font-mono text-[11px] text-[#6b7280]">{conditionText(rule)}</code>
      </td>
      <td className="px-3 py-3 text-center w-[14%]">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold ${
            met ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f1f3f7] text-[#9ca3af]"
          }`}
        >
          {met ? "✓" : "✕"}
        </span>
      </td>
      <td className="px-3 py-3 text-right w-[18%]">
        <span className={`font-mono text-[12px] font-semibold ${colorClass}`}>
          {met ? effectText(rule) : "Sin efecto"}
        </span>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantalla                                                           */
/* ------------------------------------------------------------------ */

export default function ProductDetailScreen({
  productId,
  onBack,
}: {
  productId: number | null;
  onBack: () => void;
}) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [rules, setRules] = useState<ApiPricingRule[]>([]);
  const [calc, setCalc] = useState<ApiPriceCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false); // Nuevo estado para el botón
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    if (productId == null) return;
    try {
      setLoading(true);
      setError(null);
      const [productsRes, rulesData, calcData] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetchRulesByProduct(productId),
        fetchProductPrice(productId),
      ]);
      if (!productsRes.ok) throw new Error("No se pudo cargar el producto.");
      const products: ApiProduct[] = await productsRes.json();
      const found = products.find((p) => p.id === productId);
      if (!found) throw new Error("El producto no existe.");
      setProduct(found);
      setRules(rulesData);
      setCalc(calcData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el detalle del producto.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Función para activar/desactivar el producto directamente desde aquí
  const handleToggleStatus = async () => {
    if (!product) return;
    setTogglingStatus(true);
    const action = product.productStatus === "ACTIVE" ? "deactivate" : "activate";
    
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al cambiar el estado del producto.");
      
      const updatedProduct = await res.json();
      setProduct(updatedProduct);
      setToast({ 
        message: `Producto ${updatedProduct.productStatus === "ACTIVE" ? "activado" : "desactivado"} correctamente.`, 
        type: "success" 
      });
      
      // Si pasa de inactivo a activo, recargamos el precio calculado
      if (updatedProduct.productStatus === "ACTIVE") {
        setCalc(await fetchProductPrice(product.id));
      }
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Error al cambiar estado.", type: "error" });
    } finally {
      setTogglingStatus(false);
    }
  };

  const sortedRules = useMemo(() => [...rules].sort(byPriority), [rules]);
  const applied = useMemo(() => new Set(calc?.appliedRuleIds ?? []), [calc]);
  const appliedInOrder = useMemo(() => sortedRules.filter((r) => applied.has(r.id)), [sortedRules, applied]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    // Si el producto está inactivo, no permitimos reordenar
    if (!over || active.id === over.id || saving || productId == null || product?.productStatus === "INACTIVE") return;

    const oldIndex = sortedRules.findIndex((r) => r.id === active.id);
    const newIndex = sortedRules.findIndex((r) => r.id === over.id);
    const reordered = arrayMove(sortedRules, oldIndex, newIndex);

    const current = sortedRules.map((r) => r.priority);
    const canReuse = current.every((p) => p != null) && new Set(current).size === current.length;
    const slots = canReuse ? [...(current as number[])].sort((a, b) => a - b) : reordered.map((_, i) => i + 1);
    
    const payload = reordered.map((r, i) => ({ ruleId: r.id, priority: slots[i] }));

    const previous = rules;
    const newPriority = new Map(payload.map((p) => [p.ruleId, p.priority]));
    setRules((list) => list.map((r) => (newPriority.has(r.id) ? { ...r, priority: newPriority.get(r.id) } : r)));

    setSaving(true);
    try {
      const saved = await prioritizeRules(productId, payload);
      setRules(saved);
      setCalc(await fetchProductPrice(productId));
      setToast({ message: "Orden de prioridad guardado.", type: "success" });
    } catch (e) {
      setRules(previous);
      setToast({ message: e instanceof Error ? e.message : "No se pudo guardar el orden.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (productId == null) {
    return (
      <div className="p-8">
        <button onClick={onBack} className="text-[13px] text-[#1a56db] font-semibold">
          ← Volver a Productos
        </button>
        <p className="mt-4 text-[13px] text-[#6b7280]">Selecciona un producto para ver su detalle.</p>
      </div>
    );
  }

  const basePrice = calc?.basePrice ?? product?.basePrice ?? 0;
  const finalPrice = calc?.finalPrice ?? basePrice;
  const percentDiff = basePrice ? ((finalPrice - basePrice) / basePrice) * 100 : 0;
  
  const isInactiveProduct = product?.productStatus === "INACTIVE";

  return (
    <div className="p-8 max-w-5xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a56db] transition-colors mb-5"
      >
        ← Volver a Productos
      </button>

      {error && (
        <div className="mb-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
          {error}
        </div>
      )}

      {loading || !product ? (
        <div className="bg-white border border-[#e2e6ed] rounded-[8px] p-8 text-center text-[#6b7280]">Cargando…</div>
      ) : (
        <>
          {/* Header con Estado y Botón para alternar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#0f1117] font-display">{product.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  product.productStatus === "ACTIVE"
                    ? "bg-[#dcfce7] text-[#16a34a]"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.productStatus === "ACTIVE" ? "bg-[#16a34a]" : "bg-gray-500"}`} />
                  {product.productStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>
              <span className="font-mono text-[12px] text-[#9ca3af] mt-1 block">SKU: {product.sku}</span>
            </div>
            
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors border ${
                product.productStatus === "ACTIVE"
                  ? "text-[#dc2626] border-[#fecaca] hover:bg-[#fef2f2]"
                  : "text-[#16a34a] border-[#bbf7d0] hover:bg-[#f0fdf4]"
              } disabled:opacity-50`}
            >
              {togglingStatus ? "Cambiando..." : product.productStatus === "ACTIVE" ? "Desactivar producto" : "Activar producto"}
            </button>
          </div>

          {/* Banner de advertencia si está inactivo */}
          {isInactiveProduct && (
            <div className="mb-5 px-4 py-3 bg-gray-100 border border-gray-300 rounded-[8px] flex items-start gap-3">
              <svg className="text-gray-500 mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 5v4M8 11v1M2.5 13.5L8 2.5l5.5 11h-11z" />
              </svg>
              <div>
                <p className="text-[13px] font-bold text-gray-700">Este producto está Inactivo</p>
                <p className="text-[12px] text-gray-600 mt-0.5">
                  Las reglas de pricing no se están aplicando al cálculo. El precio mostrado es únicamente el precio base.
                </p>
              </div>
            </div>
          )}

          {/* Precio y Desglose - Se aplica grayscale si está inactivo */}
          <div className={`bg-white border border-[#e2e6ed] rounded-[10px] p-6 mb-5 transition-all ${isInactiveProduct ? "grayscale opacity-60" : ""}`}>
            <div className="flex gap-8">
              <div>
                <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Precio base</div>
                <div className="text-[22px] font-bold text-[#374151] font-display">{fmt(basePrice)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
                  Precio actual calculado
                </div>
                <div className="text-[32px] font-bold text-[#1a56db] font-display">
                  {isInactiveProduct ? fmt(basePrice) : fmt(finalPrice)}
                </div>
                {!isInactiveProduct && percentDiff !== 0 && (
                  <div className={`text-[12px] font-medium mt-0.5 ${percentDiff > 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                    {percentDiff > 0 ? "↑ +" : "↓ "}
                    {percentDiff.toFixed(1)}% sobre el precio base
                  </div>
                )}
              </div>
            </div>

            {/* DESGLOSE DEL CÁLCULO */}
            {!isInactiveProduct && (
              <div className="mt-5 pt-4 border-t border-[#f1f3f7] flex flex-wrap items-center gap-2 text-[13px] text-[#374151]">
                <span className="font-mono text-[#6b7280]">{fmt(basePrice)}</span>
                <span className="text-[#9ca3af]">base</span>
                
                {appliedInOrder.map((rule) => (
                  <span 
                    key={rule.id} 
                    className="inline-flex items-center gap-1.5 bg-[#f8f9fb] px-1.5 py-1 rounded border border-[#e2e6ed]"
                    title={conditionText(rule)}
                  >
                    <span className={`font-mono font-bold ${rule.effectValue >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                      {effectText(rule)}
                    </span>
                    <span className="text-[#6b7280] text-[10px] uppercase font-bold tracking-wider">
                      RGL-{String(rule.id).padStart(3, "0")}
                    </span>
                  </span>
                ))}
                
                <span className="text-[#9ca3af] mx-1">=</span>
                <span className="font-mono font-bold text-[15px] text-[#1a56db]">{fmt(finalPrice)}</span>
              </div>
            )}
            
            {calc?.summary && !isInactiveProduct && <p className="mt-3 text-[11px] text-[#9ca3af]">{calc.summary}</p>}
            {isInactiveProduct && (
              <div className="mt-5 pt-4 border-t border-[#f1f3f7] text-[13px] text-gray-500 italic">
                Sin cálculos ni reglas aplicadas.
              </div>
            )}
          </div>

          {/* TABLA UNIFICADA - Se aplica grayscale y se deshabilita el drag si está inactivo */}
          <div className={`bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden mb-5 transition-all ${isInactiveProduct ? "grayscale opacity-60" : ""}`}>
            <div className="px-5 py-3 border-b border-[#e2e6ed] bg-[#f8f9fb] flex items-center justify-between">
              <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">
                Reglas evaluadas
              </h2>
              <span className="text-[11px] text-[#9ca3af]">
                {isInactiveProduct ? "Reglas pausadas" : saving ? "Guardando…" : "Arrastra para reordenar"}
              </span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedRules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <table className="w-full text-[13px] table-fixed">
                  <thead>
                    <tr className="border-b border-[#f1f3f7] text-[11px] uppercase tracking-wide text-[#6b7280]">
                      <th className="w-8" />
                      <th className="w-12 text-left px-3 py-2.5 font-semibold">#</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Regla</th>
                      <th className="w-[26%] text-left px-3 py-2.5 font-semibold">Requisito</th>
                      <th className="w-[14%] text-center px-3 py-2.5 font-semibold">¿Cumplida?</th>
                      <th className="w-[18%] text-right px-3 py-2.5 font-semibold">Operación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-[#6b7280]">
                          Este producto no tiene reglas asociadas.
                        </td>
                      </tr>
                    )}
                    
                    {sortedRules.map((rule, i) => (
                      <SortableRuleRow
                        key={rule.id}
                        rule={rule}
                        position={i + 1}
                        met={!isInactiveProduct && applied.has(rule.id)} // Si está inactivo, forzamos a que no muestre el "✓"
                        isInactive={!isPrioritizable(rule)}
                        disabled={saving || isInactiveProduct} // Bloquea el drag si está inactivo
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}