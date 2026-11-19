import { API_URL } from "./config";
import { apiFetch } from "./http";

// ---- Reporte de impacto de precios (registros inmutables de cambios) ----

export type ChangeCause = "REGLA" | "VARIABLE" | "EDICION_MANUAL" | "PRODUCTO" | "HORARIO" | "OTRO";

export interface ApiImpactSummary {
  key: string;
  changes: number;
  increases: number;
  decreases: number;
  netDelta: number;
  avgChangePercent: number;
}

export interface ApiChangeRow {
  id: number;
  productId: number;
  productName: string;
  previousPrice: number;
  newPrice: number;
  changedAt: string;
  cause: ChangeCause;
  ruleIds: number[];
  variable?: string | null;
  variableValue?: string | null;
  changedBy?: string | null;
  detail?: string | null;
}

export interface ApiPriceImpactReport {
  overall: ApiImpactSummary;
  byCause: ApiImpactSummary[];
  byRule: ApiImpactSummary[];
  changes: ApiChangeRow[];
}

export interface ImpactReportFilter {
  productId?: number;
  cause?: ChangeCause;
  from?: string; // yyyy-MM-ddTHH:mm
  to?: string;
}

export async function fetchPriceImpactReport(filter: ImpactReportFilter): Promise<ApiPriceImpactReport> {
  const params = new URLSearchParams();
  if (filter.productId) params.set("productId", String(filter.productId));
  if (filter.cause) params.set("cause", filter.cause);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const response = await apiFetch(`${API_URL}/api/price-changes/report?${params.toString()}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "No se pudo cargar el reporte de impacto.");
  }
  return response.json();
}
