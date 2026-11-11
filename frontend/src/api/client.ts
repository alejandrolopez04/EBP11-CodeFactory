export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
import { apiFetch } from "./http";

const PRICING_RULES_URL = `${API_URL}/api/pricing_rules`;
const PRICING_RULES_MANAGEMENT_URL = `${API_URL}/api/pricing-rules-management`;

export interface ApiPricingRule {
  id: number;
  variableType: "DEMANDA" | "DISPONIBILIDAD" | "TEMPORAL";
  level?: "CRITICO" | "BAJO" | "NORMAL" | "ALTO";
  timeCondition?: "HORA_PICO" | "TEMPORADA_ALTA";
  effectType: "PORCENTAJE" | "VALOR";
  effectValue: number;
  productIds: number[];
  ruleStatus: "ACTIVE" | "INACTIVE";
  priority?: number;
  validFrom?: string;
  validTo?: string;
}

export async function fetchPricingRules(): Promise<ApiPricingRule[]> {
  const response = await apiFetch(PRICING_RULES_URL);

  if (!response.ok) {
    throw new Error("No se pudieron cargar las reglas de pricing.");
  }

  return response.json();
}

export interface UpdatePricingRulePayload {
  variableType: ApiPricingRule["variableType"];
  level?: ApiPricingRule["level"];
  timeCondition?: ApiPricingRule["timeCondition"];
  effectType: ApiPricingRule["effectType"];
  effectValue: number;
  productIds: number[];
  validFrom: string;
  validTo: string;
}

export async function updatePricingRule(
  id: number,
  payload: UpdatePricingRulePayload
): Promise<ApiPricingRule> {
  const response = await apiFetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo actualizar la regla.");
  }

  return response.json();
}

export async function activatePricingRule(id: number): Promise<ApiPricingRule> {
  const response = await apiFetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}/activate`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("No se pudo activar la regla.");
  }

  return response.json();
}

export async function deactivatePricingRule(id: number): Promise<ApiPricingRule> {
  const response = await apiFetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}/deactivate`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("No se pudo desactivar la regla.");
  }

  return response.json();
}

export async function prioritizeRules(
  productId: number,
  priorities: { ruleId: number; priority: number }[]
): Promise<ApiPricingRule[]> {
  const response = await apiFetch(`${PRICING_RULES_URL}/priorities`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, priorities }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo guardar el orden de prioridad.");
  }

  return response.json();
}

/** GET /api/pricing_rules?productId=N -> reglas del producto, ordenadas por prioridad. */
export async function fetchRulesByProduct(productId: number): Promise<ApiPricingRule[]> {
  const response = await apiFetch(`${PRICING_RULES_URL}?productId=${productId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudieron cargar las reglas del producto.");
  }
  return response.json();
}

export interface ApiPriceCalculation {
  basePrice: number;
  finalPrice: number;
  appliedRuleIds: number[];
  summary?: string;
}

/** HU13: condición y efecto de una regla para simular (nueva, o existente con cambios). */
export interface SimulationRuleDraft {
  variableType: ApiPricingRule["variableType"];
  level?: ApiPricingRule["level"];
  timeCondition?: ApiPricingRule["timeCondition"];
  effectType: ApiPricingRule["effectType"];
  effectValue: number;
}

export interface ApiProductSimulation {
  productId: number;
  productName: string;
  sku: string;
  productActive: boolean;
  currentPrice: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  simulatedPrice: number;
  /** Precio antes de acotarlo al rango del producto */
  calculatedPrice: number;
  clampedToMax: boolean;
  clampedToMin: boolean;
  /** Si la regla simulada llegó a aplicarse (su condición se cumple hoy) */
  ruleApplied: boolean;
  appliedRuleIds: number[];
}

export interface ApiSimulationResult {
  /** Siempre true: el resultado es hipotético */
  simulation: boolean;
  ruleId: number | null;
  simulatedAt: string;
  elapsedMs: number;
  products: ApiProductSimulation[];
}

/** HU13: POST /api/simulations -> precio que tendrían los productos con la regla. No modifica precios ni historial. */
export async function simulatePrices(request: {
  ruleId?: number;
  rule?: SimulationRuleDraft;
  productIds: number[];
}): Promise<ApiSimulationResult> {
  const response = await apiFetch(`${API_URL}/api/simulations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo ejecutar la simulación.");
  }
  return response.json();
}

/** GET /api/products/:id/price -> precio calculado por el motor y reglas que se aplicaron. */
export async function fetchProductPrice(productId: number): Promise<ApiPriceCalculation> {
  const response = await apiFetch(`${API_URL}/api/products/${productId}/price`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo calcular el precio.");
  }
  return response.json();
}
