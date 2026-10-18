import { useEffect, useState } from "react";
import RuleFormModal from "./RuleFormModal";
import Toast from "@/components/Toast.tsx";
import {
  activatePricingRule,
  deactivatePricingRule,
  fetchPricingRules,
  type ApiPricingRule,
} from "../api/client";

const VARIABLE_LABELS: Record<string, string> = {
  DEMANDA: "Demanda",
  DISPONIBILIDAD: "Disponibilidad",
  TEMPORAL: "Horario",
};

const LEVEL_LABELS: Record<string, string> = {
  CRITICO: "Crítico",
  BAJO: "Bajo",
  NORMAL: "Normal",
  ALTO: "Alto",
};

const TIME_LABELS: Record<string, string> = {
  HORA_PICO: "Hora pico",
  TEMPORADA_ALTA: "Temporada alta",
};

function getConditionText(rule: ApiPricingRule): string {
  const variable = VARIABLE_LABELS[rule.variableType] ?? rule.variableType;

  if (rule.variableType === "TEMPORAL") {
    return `${variable} = ${TIME_LABELS[rule.timeCondition ?? ""] ?? rule.timeCondition ?? "—"}`;
  }

  return `${variable} = ${LEVEL_LABELS[rule.level ?? ""] ?? rule.level ?? "—"}`;
}

function getEffectText(rule: ApiPricingRule): string {
  return rule.effectType === "PORCENTAJE"
    ? `+${rule.effectValue}%`
    : `+$${rule.effectValue}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string): string {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PricingRulesScreen() {
  const [rules, setRules] = useState<ApiPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ApiPricingRule | null>(null);
  const [confirmRule, setConfirmRule] = useState<ApiPricingRule | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPricingRules();
      setRules(data);
    } catch {
      setError("No se pudieron cargar las reglas de pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const handleToggleStatus = async () => {
    if (!confirmRule) return;

    try {
      if (confirmRule.ruleStatus === "ACTIVE") {
        await deactivatePricingRule(confirmRule.id);
        setToast("Regla desactivada exitosamente.");
      } else {
        await activatePricingRule(confirmRule.id);
        setToast("Regla activada exitosamente.");
      }

      setConfirmRule(null);
      await loadRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado de la regla.");
      setConfirmRule(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Reglas de Pricing</h1>
        <button
          onClick={() => {
            setEditingRule(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors"
        >
          + Crear regla
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#e2e6ed] rounded-[8px] p-8 text-center text-[#6b7280]">
          Cargando reglas...
        </div>
      ) : (
        <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-x-auto">
          <table className="w-full text-[13px] table-fixed min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                <th className="w-[10%] text-left px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">ID</th>
                <th className="w-[18%] text-left px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Condición</th>
                <th className="w-[10%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Efecto</th>
                <th className="w-[12%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Desde</th>
                <th className="w-[12%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Hasta</th>
                <th className="w-[10%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Productos</th>
                <th className="w-[12%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Estado</th>
                <th className="w-[16%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[#6b7280]">
                    No hay reglas de pricing registradas.
                  </td>
                </tr>
              )}

              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-[#f1f3f7] hover:bg-[#f8f9fb]">
                  <td className="px-3 py-3 font-mono text-[12px] text-[#6b7280]">RGL-{String(rule.id).padStart(3, "0")}</td>
                  <td className="px-3 py-3 text-[#374151]">{getConditionText(rule)}</td>
                  <td className="px-3 py-3 text-center font-semibold text-[#16a34a]">{getEffectText(rule)}</td>
                  <td className="px-3 py-3 text-center text-[#374151]">{formatDate(rule.validFrom)}</td>
                  <td className="px-3 py-3 text-center text-[#374151]">{formatDate(rule.validTo)}</td>
                  <td className="px-3 py-3 text-center text-[#374151]">{rule.productIds?.length ?? 0}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      rule.ruleStatus === "ACTIVE"
                        ? "bg-[#dcfce7] text-[#16a34a]"
                        : "bg-[#f1f3f7] text-[#9ca3af]"
                    }`}>
                      {rule.ruleStatus === "ACTIVE" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowModal(true);
                        }}
                        className="px-2 py-1 rounded-[4px] text-[11px] font-semibold text-[#1a56db] hover:bg-[#e8f0fd]"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => setConfirmRule(rule)}
                        className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold ${
                          rule.ruleStatus === "ACTIVE"
                            ? "text-[#dc2626] hover:bg-[#fef2f2]"
                            : "text-[#16a34a] hover:bg-[#dcfce7]"
                        }`}
                      >
                        {rule.ruleStatus === "ACTIVE" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmRule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-sm shadow-xl p-6">
            <h3 className="text-[15px] font-bold text-[#0f1117] mb-2">
              ¿Deseas {confirmRule.ruleStatus === "ACTIVE" ? "desactivar" : "activar"} esta regla?
            </h3>
            <p className="text-[13px] text-[#6b7280] mb-5">
              {confirmRule.ruleStatus === "ACTIVE"
                ? "La regla dejará de aplicarse en los próximos cálculos, pero conservará su configuración."
                : "La regla volverá a evaluarse en los próximos cálculos de precio."}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRule(null)}
                className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-[13px] font-semibold text-white rounded-[6px] ${
                  confirmRule.ruleStatus === "ACTIVE" ? "bg-[#dc2626]" : "bg-[#16a34a]"
                }`}
              >
                {confirmRule.ruleStatus === "ACTIVE" ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <RuleFormModal
          editingRule={editingRule}
          onClose={() => setShowModal(false)}
          onSaved={async (message) => {
            setToast(message);
            await loadRules();
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
