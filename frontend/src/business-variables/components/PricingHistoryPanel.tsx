import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../api/client";
import { apiFetch } from "../../api/http";

export type PricingHistoryVersion = {
  traceId: number;
  productId: number;
  price: number;
  eventType: "CALCULATION" | "REVERSION";
  revertedFromTraceId: number | null;
  revertedBy: string | null;
  appliedRuleIds: number[];
  createdAt: string;
};

const HISTORY_URL = `${API_URL}/api/pricing-history`;

export async function fetchPricingHistory(
  productId: number,
): Promise<PricingHistoryVersion[]> {
  const response = await apiFetch(`${HISTORY_URL}/${productId}`);

  if (!response.ok) {
    throw new Error(`Error ${response.status} al cargar el historial`);
  }

  return response.json();
}

export async function revertPricingVersion(
  traceId: number,
  administratorEmail: string,
): Promise<PricingHistoryVersion> {
  const response = await apiFetch(`${HISTORY_URL}/${traceId}/revert`, {
    method: "POST",
    headers: {
      "X-User-Email": administratorEmail,
    },
  });

  if (response.status === 403) {
    throw new Error("No cuenta con permisos suficientes");
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status} al revertir la versión`);
  }

  return response.json();
}

export default function PricingHistoryPanel({
  productId,
  userEmail,
  isAdmin,
}: {
  productId: number;
  userEmail: string;
  isAdmin: boolean;
}) {
  const [history, setHistory] = useState<PricingHistoryVersion[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchPricingHistory(productId));
    } catch {
      setMessage("No fue posible cargar el historial de pricing");
    }
  }, [productId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleRevert(traceId: number) {
    try {
      await revertPricingVersion(traceId, userEmail);
      setMessage("Reversión registrada correctamente");
      await loadHistory();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible revertir la versión"
      );
    }
  }

  return (
    <section>
      <h2>Historial de pricing</h2>

      {message && <p role="alert">{message}</p>}

      {history.length === 0 ? (
        <p>No hay versiones registradas para este producto.</p>
      ) : (
        <ul>
          {history.map((version) => (
            <li key={version.traceId}>
              <strong>Versión #{version.traceId}</strong>
              <br />
              Precio: ${version.price}
              <br />
              Evento: {version.eventType === "REVERSION" ? "Reversión" : "Cálculo"}
              <br />
              Fecha: {new Date(version.createdAt).toLocaleString()}
              <br />
              Reglas aplicadas: {version.appliedRuleIds.join(", ") || "Ninguna"}
              <br />
              {isAdmin && (
                <button onClick={() => handleRevert(version.traceId)}>
                  Revertir a esta versión
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
