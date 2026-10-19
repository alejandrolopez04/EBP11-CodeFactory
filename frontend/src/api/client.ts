export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  const response = await fetch(PRICING_RULES_URL);

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
}

export async function updatePricingRule(
  id: number,
  payload: UpdatePricingRulePayload
): Promise<ApiPricingRule> {
  const params = new URLSearchParams({
    variableType: payload.variableType,
    effectType: payload.effectType,
    effectValue: String(payload.effectValue),
  });

  if (payload.level) {
    params.append("level", payload.level);
  }

  if (payload.timeCondition) {
    params.append("timeCondition", payload.timeCondition);
  }

  const response = await fetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}?${params.toString()}`, {
    method: "PUT",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo actualizar la regla.");
  }

  return response.json();
}

export async function activatePricingRule(id: number): Promise<ApiPricingRule> {
  const response = await fetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}/activate`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("No se pudo activar la regla.");
  }

  return response.json();
}

export async function deactivatePricingRule(id: number): Promise<ApiPricingRule> {
  const response = await fetch(`${PRICING_RULES_MANAGEMENT_URL}/${id}/deactivate`, {
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
  const response = await fetch(`${PRICING_RULES_URL}/priorities`, {
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
  const response = await fetch(`${PRICING_RULES_URL}?productId=${productId}`);
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

/** GET /api/products/:id/price -> precio calculado por el motor y reglas que se aplicaron. */
export async function fetchProductPrice(productId: number): Promise<ApiPriceCalculation> {
  const response = await fetch(`${API_URL}/api/products/${productId}/price`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo calcular el precio.");
  }
  return response.json();
}
