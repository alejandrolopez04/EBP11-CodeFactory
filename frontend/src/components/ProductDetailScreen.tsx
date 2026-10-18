import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

/* =====================================================================
 *  📡 ENDPOINTS DEL BACKEND (contrato)
 *  ---------------------------------------------------------------------
 *  GET  /api/products/:id           → ProductDetailResponse
 *  POST /api/products/:id/reorder   → { order: number[], calculatedPrice: number }
 * ===================================================================== */
const API_ENDPOINT_PRODUCT_DETAIL = (id: number) => `/api/products/${id}`;
const API_ENDPOINT_REORDER = (id: number) => `/api/products/${id}/reorder`;

/* =====================================================================
 *  🧪 MOCK DATA — Simula la respuesta del backend
 *  ---------------------------------------------------------------------
 *  Sirve como contrato para el equipo de backend. El día que el endpoint
 *  GET /api/products/:id esté listo, solo hay que reemplazar `MOCK_PRODUCT_DETAIL`
 *  por el `fetch` real y eliminar el bloque de simulación.
 * ===================================================================== */

type VariableType = "DEMANDA" | "DISPONIBILIDAD" | "TEMPORAL";
type Level = "CRITICO" | "BAJO" | "NORMAL" | "ALTO";
type TimeCondition = "HORA_PICO" | "TEMPORADA_ALTA";
type EffectType = "PORCENTAJE" | "VALOR";
type RuleStatus = "ACTIVE" | "INACTIVE";

/**
 * Regla evaluada.
 * Es una regla de pricing + el resultado de su evaluación frente a las
 * variables actuales del producto. El backend decide `met` aplicando las
 * reglas de negocio; el frontend solo lo consume.
 */
interface EvaluatedRule {
  id: number;
  name: string;
  variableType: VariableType;
  level?: Level;                 // DEMANDA | DISPONIBILIDAD
  timeCondition?: TimeCondition; // TEMPORAL
  effectType: EffectType;
  effectValue: number;           // 18 = +18%, 500 = +$500, -10 = -10%
  met: boolean;                  // ← backend ya decidió si la regla aplica
  order: number;                 // posición inicial en la pila de cálculo
  productIds: number[];
  ruleStatus: RuleStatus;
  validFrom: string;
  validTo: string;
}

/** GET /api/products/:id — respuesta esperada del backend */
interface ProductDetailResponse {
  product: {
    id: number;
    sku: string;
    name: string;
    basePrice: number;
  };
  variables: {
    demanda: { level: Level; label: string };
    disponibilidad: { level: Level; percentage: number; label: string };
    temporal: { timeCondition: TimeCondition; label: string };
  };
  rules: EvaluatedRule[];
}

const MOCK_PRODUCT_DETAIL: ProductDetailResponse = {
  product: {
    id: 1,
    sku: "SUB-PRE-001",
    name: "Suscripción Premium Mensual",
    basePrice: 29900,
  },
  variables: {
    demanda: { level: "ALTO", label: "Alta" },
    disponibilidad: { level: "NORMAL", percentage: 62, label: "Normal" },
    temporal: { timeCondition: "HORA_PICO", label: "Hora pico" },
  },
  rules: [
    {
      id: 1,
      name: "Recargo hora pico",
      variableType: "TEMPORAL",
      timeCondition: "HORA_PICO",
      effectType: "PORCENTAJE",
      effectValue: 18,
      met: true,
      order: 1,
      productIds: [1],
      ruleStatus: "ACTIVE",
      validFrom: "2026-01-01T00:00:00",
      validTo: "2026-12-31T23:59:59",
    },
    {
      id: 2,
      name: "Ajuste alta demanda",
      variableType: "DEMANDA",
      level: "ALTO",
      effectType: "PORCENTAJE",
      effectValue: 22,
      met: true,
      order: 2,
      productIds: [1],
      ruleStatus: "ACTIVE",
      validFrom: "2026-01-01T00:00:00",
      validTo: "2026-12-31T23:59:59",
    },
    {
      id: 3,
      name: "Cargo fijo de mantenimiento",
      variableType: "DISPONIBILIDAD",
      level: "NORMAL",
      effectType: "VALOR",
      effectValue: 500,
      met: true,
      order: 3,
      productIds: [1],
      ruleStatus: "ACTIVE",
      validFrom: "2026-01-01T00:00:00",
      validTo: "2026-12-31T23:59:59",
    },
    {
      id: 4,
      name: "Descuento baja demanda",
      variableType: "DEMANDA",
      level: "BAJO",
      effectType: "PORCENTAJE",
      effectValue: -10,
      met: false,
      order: 4,
      productIds: [1],
      ruleStatus: "ACTIVE",
      validFrom: "2026-01-01T00:00:00",
      validTo: "2026-12-31T23:59:59",
    },
    {
      id: 5,
      name: "Stock crítico",
      variableType: "DISPONIBILIDAD",
      level: "CRITICO",
      effectType: "PORCENTAJE",
      effectValue: 5,
      met: false,
      order: 5,
      productIds: [1],
      ruleStatus: "ACTIVE",
      validFrom: "2026-01-01T00:00:00",
      validTo: "2026-12-31T23:59:59",
    },
  ],
};

/* =====================================================================
 *  Helpers
 * ===================================================================== */

function calculatePrice(basePrice: number, rules: EvaluatedRule[]): number {
  return rules.reduce((currentPrice, rule) => {
    if (!rule.met) return currentPrice;
    if (rule.effectType === "PORCENTAJE") {
      return currentPrice * (1 + rule.effectValue / 100);
    }
    return currentPrice + rule.effectValue;
  }, basePrice);
}

/** Requisito evaluado por la regla, en el lenguaje del backend. */
function getRuleRequirement(rule: EvaluatedRule): string {
  if (rule.variableType === "TEMPORAL") {
    return `TEMPORAL = ${rule.timeCondition ?? "—"}`;
  }
  return `${rule.variableType} = ${rule.level ?? "—"}`;
}

/** Operación matemática que aplica la regla (o "Sin efecto"). */
function formatOperation(rule: EvaluatedRule): string {
  if (!rule.met) return "Sin efecto";
  const sign = rule.effectValue >= 0 ? "+" : "−";
  return rule.effectType === "PORCENTAJE"
    ? `${sign}${Math.abs(rule.effectValue)}%`
    : `${sign}$${Math.abs(rule.effectValue).toLocaleString("es-CL")}`;
}

/* =====================================================================
 *  Fila sortable
 * ===================================================================== */

function SortableRuleRow({ rule }: { rule: EvaluatedRule }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rule.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "#eef2ff" : undefined,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  const isPositive = rule.effectValue >= 0;
  const colorClass = !rule.met
    ? "text-[#9ca3af]"
    : isPositive
    ? "text-[#16a34a]"
    : "text-[#dc2626]";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-[#f1f3f7] last:border-b-0 hover:bg-[#f8f9fb] transition-colors"
    >
      <td className="pl-3 pr-1 py-3 w-8">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reordenar regla"
          className="cursor-grab active:cursor-grabbing text-[#9ca3af] hover:text-[#1a56db] p-1 rounded transition-colors touch-none"
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
      <td className="px-3 py-3 font-medium text-[#0f1117]">{rule.name}</td>
      <td className="px-3 py-3">
        <code className="font-mono text-[11px] text-[#6b7280]">
          {getRuleRequirement(rule)}
        </code>
      </td>
      <td className="px-3 py-3 text-center">
        {rule.met ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#dcfce7]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#f1f3f7]">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 2l6 6M8 2L2 8" />
            </svg>
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <span className={`font-mono text-[12px] font-semibold ${colorClass}`}>
          {formatOperation(rule)}
        </span>
      </td>
    </tr>
  );
}

/* =====================================================================
 *  Pantalla principal
 * ===================================================================== */

interface SimulatedRequest {
  endpoint: string;
  method: "POST";
  payload: { order: number[]; calculatedPrice: number };
  timestamp: string;
}

export default function ProductDetailScreen({ onBack }: { onBack: () => void }) {
  const [varOpen, setVarOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatedRequest, setSimulatedRequest] = useState<SimulatedRequest | null>(null);

  const { product, variables } = MOCK_PRODUCT_DETAIL;

  const [rules, setRules] = useState<EvaluatedRule[]>(() =>
    [...MOCK_PRODUCT_DETAIL.rules].sort((a, b) => a.order - b.order)
  );

  const current = useMemo(() => calculatePrice(product.basePrice, rules), [product.basePrice, rules]);
  const percentDiff = ((current - product.basePrice) / product.basePrice) * 100;
  const appliedRules = rules.filter((r) => r.met);

  /* --- Drag & drop --- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRules((items) => {
      const oldIndex = items.findIndex((r) => r.id === active.id);
      const newIndex = items.findIndex((r) => r.id === over.id);
      return arrayMove(items, oldIndex, newIndex).map((rule, index) => ({
        ...rule,
        order: index + 1,
      }));
    });
  };

  /* --- Simulación del envío al backend (debounce 2s) --- */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const payload = {
        order: rules.map((r) => r.id),
        calculatedPrice: Math.round(current),
      };
      const endpoint = API_ENDPOINT_REORDER(product.id);

      // 🔴 MODO MOCK — no llamamos al backend, mostramos el payload en pantalla.
      // Cuando el endpoint esté listo, basta con reemplazar el bloque de abajo
      // por el fetch comentado:
      //
      // await fetch(endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      //
      void endpoint;

      setSimulatedRequest({
        endpoint,
        method: "POST",
        payload,
        timestamp: new Date().toLocaleTimeString("es-CO"),
      });
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rules, current, product.id]);

  /* --- Copy payload to clipboard --- */
  const handleCopy = async () => {
    if (!simulatedRequest) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(simulatedRequest.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const variableCards = [
    {
      label: "Demanda",
      value: variables.demanda.label,
      icon: "📈",
      color: "text-[#16a34a] bg-[#dcfce7]",
    },
    {
      label: "Disponibilidad",
      value: `${variables.disponibilidad.percentage}%`,
      icon: "📦",
      color: "text-[#374151] bg-[#e8ecf2]",
    },
    {
      label: "Horario",
      value: variables.temporal.label,
      icon: "🕐",
      color: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a56db] transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M9 2L4 7l5 5" />
        </svg>
        Volver a Productos
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1117] font-display">{product.name}</h1>
          <span className="font-mono text-[12px] text-[#9ca3af] mt-0.5 block">
            SKU: {product.sku} · 🧪 Mock activo
          </span>
        </div>
        <button className="px-3 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 8a6 6 0 1 0 1.5-3.9" />
            <path d="M2 3v3.5L5.5 8" />
          </svg>
          Ver historial
        </button>
      </div>

      {/* Price card */}
      <div className="bg-white border border-[#e2e6ed] rounded-[10px] p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-8">
            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
                Precio base
              </div>
              <div className="text-[22px] font-bold text-[#374151] font-display">
                ${product.basePrice.toLocaleString("es-CL")}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
                Precio actual calculado
              </div>
              <div className="text-[32px] font-bold text-[#1a56db] font-display">
                ${Math.round(current).toLocaleString("es-CL")}
              </div>
              {percentDiff !== 0 && (
                <div
                  className={`text-[12px] font-medium mt-0.5 ${
                    percentDiff > 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                  }`}
                >
                  {percentDiff > 0 ? "↑ +" : "↓ "}
                  {percentDiff.toFixed(1)}% sobre el precio base
                </div>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fefce8] border border-amber-200 text-amber-700 text-[12px] font-semibold rounded-full">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2v4M6 8v1" />
              <circle cx="6" cy="6" r="5" />
            </svg>
            Ajustado por reglas activas
          </span>
        </div>

        {/* Calculation breakdown — orden secuencial */}
        <div className="mt-5 pt-4 border-t border-[#f1f3f7] flex items-center gap-2 flex-wrap text-[13px] text-[#374151]">
          <span className="font-mono text-[#6b7280]">${product.basePrice.toLocaleString("es-CL")}</span>
          <span className="text-[#9ca3af]">base</span>
          {appliedRules.map((rule) => {
            const isPositive = rule.effectValue >= 0;
            const operator = isPositive ? "+" : "−";
            const valueLabel =
              rule.effectType === "PORCENTAJE"
                ? `${Math.abs(rule.effectValue)}%`
                : `$${Math.abs(rule.effectValue).toLocaleString("es-CL")}`;
            return (
              <span key={rule.id} className="inline-flex items-center gap-1.5">
                <span className={`font-mono ${isPositive ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                  {operator}
                  {valueLabel}
                </span>
                <span className="text-[#9ca3af] text-[11px]">{rule.name.toLowerCase()}</span>
              </span>
            );
          })}
          <span className="text-[#9ca3af] mx-2">=</span>
          <span className="font-mono font-bold text-[#1a56db]">
            ${Math.round(current).toLocaleString("es-CL")}
          </span>
        </div>
      </div>

      {/* Rules evaluated — sortable */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-[#e2e6ed] bg-[#f8f9fb] flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">
            Reglas evaluadas
          </h2>
          <span className="text-[11px] text-[#9ca3af]">Arrastra para reordenar</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-[13px] table-fixed">
              <thead>
                <tr className="border-b border-[#f1f3f7]">
                  <th className="w-8" />
                  <th className="text-left px-3 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide">
                    Nombre de la regla
                  </th>
                  <th className="text-left px-3 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide w-[26%]">
                    Requisito
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide w-[14%]">
                    ¿Cumplida?
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold text-[#6b7280] text-[11px] uppercase tracking-wide w-[16%]">
                    Operación
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <SortableRuleRow key={rule.id} rule={rule} />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Variables section — collapsible */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden mb-5">
        <button
          onClick={() => setVarOpen(!varOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#f8f9fb] transition-colors"
        >
          <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">
            Variables evaluadas en este cálculo
          </h2>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`transition-transform ${varOpen ? "rotate-180" : ""}`}
          >
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
        {varOpen && (
          <div className="px-5 pb-4 pt-1 border-t border-[#f1f3f7] grid grid-cols-3 gap-3">
            {variableCards.map((v) => (
              <div key={v.label} className="border border-[#e2e6ed] rounded-[6px] p-3">
                <div className="text-[11px] font-semibold text-[#6b7280] mb-2">{v.label}</div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-semibold ${v.color}`}
                >
                  <span>{v.icon}</span>
                  {v.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backend contract — collapsible */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
        <button
          onClick={() => setContractOpen(!contractOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#f8f9fb] transition-colors"
        >
          <h2 className="text-[12px] font-bold text-[#374151] font-display uppercase tracking-wide">
            🔧 Contrato del backend (mock)
          </h2>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`transition-transform ${contractOpen ? "rotate-180" : ""}`}
          >
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
        {contractOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-[#f1f3f7] space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase mb-1">
                Endpoints
              </div>
              <pre className="text-[11px] font-mono bg-[#f8f9fb] p-3 rounded border border-[#e2e6ed] whitespace-pre-wrap">
{`GET  ${API_ENDPOINT_PRODUCT_DETAIL(1)}
     → ProductDetailResponse

POST ${API_ENDPOINT_REORDER(1)}
     → { order: number[], calculatedPrice: number }`}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase mb-1">
                GET · respuesta esperada (mock actual)
              </div>
              <pre className="text-[11px] font-mono bg-[#0f172a] text-[#e2e8f0] p-3 rounded overflow-auto max-h-72 whitespace-pre">
                {JSON.stringify(MOCK_PRODUCT_DETAIL, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase mb-1">
                POST · payload que envía el frontend
              </div>
              <pre className="text-[11px] font-mono bg-[#0f172a] text-[#e2e8f0] p-3 rounded whitespace-pre">
{JSON.stringify(
  {
    order: rules.map((r) => r.id),
    calculatedPrice: Math.round(current),
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Simulated request panel — bottom right */}
      {simulatedRequest && (
        <div className="fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-3rem)] bg-white border border-[#e2e6ed] rounded-[10px] shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f3f7]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-[12px] font-bold text-[#0f1117]">
                Simulación · POST al backend
              </span>
            </div>
            <button
              onClick={() => setSimulatedRequest(null)}
              aria-label="Cerrar"
              className="text-[#9ca3af] hover:text-[#374151] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2 text-[11px]">
              <span className="px-1.5 py-0.5 bg-[#dcfce7] text-[#16a34a] font-bold rounded font-mono">
                POST
              </span>
              <code className="font-mono text-[#374151] truncate">
                {simulatedRequest.endpoint}
              </code>
            </div>
            <pre className="text-[11px] font-mono bg-[#0f172a] text-[#e2e8f0] p-3 rounded overflow-auto max-h-56 whitespace-pre">
              {JSON.stringify(simulatedRequest.payload, null, 2)}
            </pre>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-[#9ca3af]">
                {simulatedRequest.timestamp} · mock
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] font-semibold text-[#1a56db] hover:underline"
              >
                {copied ? "✓ Copiado" : "Copiar JSON"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}