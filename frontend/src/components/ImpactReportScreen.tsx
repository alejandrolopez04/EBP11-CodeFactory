import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../api/config";
import { apiFetch } from "../api/http";
import {
  fetchPriceImpactReport,
  type ApiPriceImpactReport,
  type ChangeCause,
} from "../api/impactReport";

interface ProductOption {
  id: number;
  name: string;
}

const CAUSE_LABEL: Record<ChangeCause, string> = {
  REGLA: "Regla",
  VARIABLE: "Variable de negocio",
  EDICION_MANUAL: "Edición manual",
  PRODUCTO: "Cambio de producto",
  HORARIO: "Horario / vigencia",
  OTRO: "Otro",
};

const money = (n: number) => "$" + Number(n).toLocaleString("es-CO", { maximumFractionDigits: 2 });
const signed = (n: number) => (n > 0 ? "+" : "") + money(n);
const pct = (n: number) => (n > 0 ? "+" : "") + Number(n).toFixed(2) + "%";
const tone = (n: number) => (n > 0 ? "text-[#16a34a]" : n < 0 ? "text-[#dc2626]" : "text-[#6b7280]");
const when = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default function ImpactReportScreen() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [cause, setCause] = useState<ChangeCause | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<ApiPriceImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`${API_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ProductOption[]) => setProducts(list.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setProducts([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(
        await fetchPriceImpactReport({
          productId: productId ? Number(productId) : undefined,
          cause: cause || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }, [productId, cause, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const inputCls =
    "pl-2 pr-3 py-2 font-normal bg-white border border-[#e2e6ed] rounded-[6px] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db]";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-1">Reporte de Impacto</h1>
      <p className="text-[13px] text-[#6b7280] mb-6">
        Cambios de precio registrados automáticamente.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <label className="text-[12px] font-semibold text-[#374151]">
          Producto
          <select className={`${inputCls} block mt-1`} value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Todos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-semibold text-[#374151]">
          Causa
          <select className={`${inputCls} block mt-1`} value={cause} onChange={(e) => setCause(e.target.value as ChangeCause | "")}>
            <option value="">Todas</option>
            {(Object.keys(CAUSE_LABEL) as ChangeCause[]).filter((c) => c !== "PRODUCTO").map((c) => (
              <option key={c} value={c}>{CAUSE_LABEL[c]}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-semibold text-[#374151]">
          Desde
          <input type="datetime-local" className={`${inputCls} block mt-1`} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-[12px] font-semibold text-[#374151]">
          Hasta
          <input type="datetime-local" className={`${inputCls} block mt-1`} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          onClick={() => { setProductId(""); setCause(""); setFrom(""); setTo(""); }}
          className="px-3 py-2 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7]"
        >
          Limpiar
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-[6px]">{error}</div>}
      {loading && !report && <div className="text-[13px] text-[#6b7280]">Cargando reporte…</div>}

      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <Card label="Cambios de precio" value={String(report.overall.changes)} />
            <Card label="Aumentos" value={String(report.overall.increases)} valueCls="text-[#16a34a]" />
            <Card label="Reducciones" value={String(report.overall.decreases)} valueCls="text-[#dc2626]" />
            <Card label="Variación neta" value={signed(report.overall.netDelta)} valueCls={tone(report.overall.netDelta)} />
            <Card label="Variación promedio" value={pct(report.overall.avgChangePercent)} valueCls={tone(report.overall.avgChangePercent)} />
          </div>

          {report.changes.length === 0 ? (
            <div className="bg-white border border-[#e2e6ed] rounded-[8px] px-6 py-12 text-center text-[13px] text-[#6b7280]">
              No hay cambios de precio registrados con los filtros seleccionados.
            </div>
          ) : (
            <>

              <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e2e6ed] text-[13px] font-semibold text-[#0f1117]">
                  Registro de cambios
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb] text-[11px] uppercase tracking-wide text-[#6b7280]">
                        <th className="text-left px-5 py-3 font-semibold">Fecha y hora</th>
                        <th className="text-left px-5 py-3 font-semibold">Producto</th>
                        <th className="text-right px-5 py-3 font-semibold">Anterior</th>
                        <th className="text-right px-5 py-3 font-semibold">Nuevo</th>
                        <th className="text-left px-5 py-3 font-semibold">Causa</th>
                        <th className="text-left px-5 py-3 font-semibold">Origen</th>
                        <th className="text-left px-5 py-3 font-semibold">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.changes.map((c) => {
                        const delta = c.newPrice - c.previousPrice;
                        return (
                          <tr key={c.id} className="border-b border-[#f1f3f7] hover:bg-[#f8f9fb]">
                            <td className="px-5 py-3 font-mono text-[12px] text-[#6b7280] whitespace-nowrap">{when(c.changedAt)}</td>
                            <td className="px-5 py-3 text-[#0f1117]">{c.productName}</td>
                            <td className="px-5 py-3 text-right text-[#374151]">{money(c.previousPrice)}</td>
                            <td className={`px-5 py-3 text-right font-semibold ${tone(delta)}`}>
                              {delta > 0 ? "↑" : "↓"} {money(c.newPrice)}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex px-2 py-0.5 bg-[#e8ecf2] text-[#374151] text-[11px] font-medium rounded-full">
                                {CAUSE_LABEL[c.cause]}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[#374151]">
                              {c.ruleIds.length > 0 && <div>{c.ruleIds.map((id) => `RGL-${String(id).padStart(3, "0")}`).join(", ")}</div>}
                              {c.variable && <div>{c.variableValue ?? c.variable}</div>}
                            </td>
                            <td className="px-5 py-3 text-[#374151]">{c.changedBy ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Card({ label, value, valueCls = "text-[#0f1117]" }: { label: string; value: string; valueCls?: string }) {
  return (
    <div className="bg-white border border-[#e2e6ed] rounded-[8px] px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-[#6b7280] font-semibold">{label}</div>
      <div className={`text-xl font-bold mt-1 ${valueCls}`}>{value}</div>
    </div>
  );
}

