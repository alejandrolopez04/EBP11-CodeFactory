import { API_URL } from "./config";
import { apiFetch } from "./http";

export interface PriceComparisonProduct {
  id: number;
  name: string;
}

export interface PriceChange {
  at: string;
  previousPrice: number;
  newPrice: number;
  triggerType: string | null;
  trigger: string | null;
}

export interface ProductComparison {
  productId: number;
  productName: string;
  currentPrice: number;
  periodStartPrice: number;
  variation: number;
  variationPercent: number;
  trend: "UP" | "DOWN" | "STABLE";
  changes: number;
  history: PriceChange[];
  message: string | null;
}

export interface PriceComparison {
  days: number;
  from: string;
  to: string;
  products: ProductComparison[];
}

export async function fetchPriceComparison(productIds: number[], days: number): Promise<PriceComparison> {
  const params = new URLSearchParams({ productIds: productIds.join(","), days: String(days) });
  const response = await apiFetch(`${API_URL}/api/reports/price-comparison?${params}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "No se pudo generar la comparación.");
  }
  return response.json();
}