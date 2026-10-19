import { useEffect, useState } from "react";
import RuleFormModal from "./RuleFormModal";
import Toast from "@/components/Toast.tsx";
import {
  activatePricingRule,
  deactivatePricingRule,
  fetchPricingRules,
  type ApiPricingRule,
} from "../api/client";
import RestrictedButton from "../auth/RestrictedButton";
import { useProfile } from "../auth/ProfileContext";

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

/** Verifica si la regla está fuera de su rango de vigencia */
function isOutOfRange(rule: ApiPricingRule): boolean {
  if (!rule.validFrom || !rule.validTo) return false;
  const now = new Date().getTime();
  const from = new Date(rule.validFrom).getTime();
  const to = new Date(rule.validTo).getTime();
  return now < from || now > to;
}

export default function PricingRulesScreen() {
  const [rules, setRules] = useState<ApiPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ApiPricingRule | null>(null);
  const [confirmRule, setConfirmRule] = useState<ApiPricingRule | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { canModify } = useProfile();
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPricingRules();

      // 1. Detectar reglas activas que estén fuera de rango
      const activeOutOfRange = data.filter((r) => r.ruleStatus === "ACTIVE" && isOutOfRange(r));

      if (activeOutOfRange.length > 0) {
        // Desactivar automáticamente en el backend
        await Promise.all(activeOutOfRange.map((r) => deactivatePricingRule(r.id)));

        // Volver a consultar para traer el estado actualizado
        const updatedData = await fetchPricingRules();
        setRules(updatedData);
        setToast(`Se desactivaron automáticamente ${activeOutOfRange.length} regla(s) por estar fuera de vigencia.`);
      } else {
        setRules(data);
      }
    } catch {
      setError("No se pudieron cargar las reglas de pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const handleToggleStatus = async (rule: ApiPricingRule) => {
    // 2. Bloquear la activación si está fuera de rango
    if (isOutOfRange(rule) && rule.ruleStatus !== "ACTIVE") {
      setToast("No puedes activar esta regla porque está fuera de su rango de vigencia. Por favor, edita las fechas primero.");
      return;
    }

    setTogglingStatusId(rule.id);
    try {
      if (rule.ruleStatus === "ACTIVE") {
        await deactivatePricingRule(rule.id);
        setToast("Regla desactivada exitosamente.");
      } else {
        await activatePricingRule(rule.id);
        setToast("Regla activada exitosamente.");
      }
      await loadRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado de la regla.");
    } finally {
      setTogglingStatusId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Reglas de Pricing</h1>
        <RestrictedButton
          onClick={() => {
            setEditingRule(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors"
        >
          + Crear regla
        </RestrictedButton>
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
                <th className="w-[14%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Hasta</th>
                <th className="w-[10%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Productos</th>
                <th className="w-[12%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Estado</th>
                <th className="w-[14%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px]">Acciones</th>
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

              {rules.map((rule) => {
                const outOfRange = isOutOfRange(rule);

                return (
                  <tr key={rule.id} className="border-b border-[#f1f3f7] hover:bg-[#f8f9fb]">
                    <td className="px-3 py-3 font-mono text-[12px] text-[#6b7280]">RGL-{String(rule.id).padStart(3, "0")}</td>
                    <td className="px-3 py-3 text-[#374151]">{getConditionText(rule)}</td>
                    <td className="px-3 py-3 text-center font-semibold text-[#16a34a]">{getEffectText(rule)}</td>
                    <td className="px-3 py-3 text-center text-[#374151]">{formatDate(rule.validFrom)}</td>

                    {/* 3. Aviso visual de fuera de rango */}
                    <td className="px-3 py-3 text-center text-[#374151]">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span>{formatDate(rule.validTo)}</span>
                        {outOfRange && (
                          <span className="text-[9px] font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Fuera de rango
                          </span>
                        )}
                      </div>
                    </td>

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
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <RestrictedButton
                          onClick={() => {
                            setEditingRule(rule);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors"
                          title="Editar"
                        >
                          <EditIcon />
                        </RestrictedButton>

                          <div className="w-px h-5 bg-[#e2e6ed] mx-0.5" />
                          <span
                              title={!canModify ? "Solo disponible para administradores" : undefined}
                          >
                              <ToggleSwitch
                                  checked={rule.ruleStatus === "ACTIVE"}
                                  onChange={() => handleToggleStatus(rule)}
                                  disabled={!canModify || togglingStatusId === rule.id}
                              />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

/* ------------------------------------------------------------------ */
/*  Componentes de Íconos y Switch                                     */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <RestrictedButton
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-[#16a34a]" : "bg-[#9ca3af]"
      }`}
    >
      <span
        className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </RestrictedButton>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}