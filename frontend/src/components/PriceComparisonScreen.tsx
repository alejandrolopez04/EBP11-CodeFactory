import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api/config";
import { apiFetch } from "../api/http";
import {
  fetchPriceComparison,
  type PriceComparison,
  type PriceComparisonProduct,
  type ProductComparison,
} from "../api/priceComparison";

const COLORS = ["#2f6df6", "#f45b18", "#16a34a", "#8b5cf6", "#0891b2"];

const money = (value: number) => "$" + Number(value).toLocaleString("es-CO", { maximumFractionDigits: 0 });
const percent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)} %`;

export default function PriceComparisonScreen() {
  const [products, setProducts] = useState<PriceComparisonProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [period, setPeriod] = useState(30);
  const [periodMode, setPeriodMode] = useState<30 | 90 | "custom">(30);
  const [customDays, setCustomDays] = useState("");
  const [customPeriodOpen, setCustomPeriodOpen] = useState(false);
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch(`${API_URL}/api/products`)
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los productos.");
        return response.json();
      })
      .then((items: PriceComparisonProduct[]) => setProducts(items.map(({ id, name }) => ({ id, name }))))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar los productos."))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProducts = selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is PriceComparisonProduct => Boolean(product));
  const availableProducts = products.filter(
    (product) => !selectedIds.includes(product.id) && product.name.toLowerCase().includes(query.toLowerCase()),
  );

  const addProduct = (product: PriceComparisonProduct) => {
    setSelectedIds((ids) => [...ids, product.id]);
    setQuery("");
    setProductMenuOpen(false);
    setAttempted(false);
    searchRef.current?.focus();
  };

  const removeProduct = (id: number) => {
    setSelectedIds((ids) => ids.filter((selectedId) => selectedId !== id));
    setComparison(null);
  };

  const generate = async () => {
    setAttempted(true);
    if (selectedIds.length === 0) {
      setComparison(null);
      setError(null);
      return;
    }
    if (periodMode === "custom") {
      const days = Number(customDays);
      if (!/^[1-9]\d{0,2}$/.test(customDays) || days > 365) {
        setError("Ingresa un período entre 1 y 365 días.");
        setComparison(null);
        return;
      }
      setPeriod(days);
    }
    setLoadingComparison(true);
    setError(null);
    try {
      setComparison(await fetchPriceComparison(selectedIds, periodMode === "custom" ? Number(customDays) : period));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo generar la comparación.");
      setComparison(null);
    } finally {
      setLoadingComparison(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f7f8fa] px-7 py-6 lg:px-8">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold text-[#172033]">Precios actuales vs. históricos</h1>
      </header>

      <section className="rounded-[10px] border border-[#e1e5eb] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:px-5">
        <div className="grid items-end gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
          <div>
            <label htmlFor="product-search" className="mb-1.5 block text-[11px] font-medium text-[#374151]">Productos a comparar</label>
            <div className={`relative flex min-h-[35px] flex-wrap items-center gap-1.5 rounded-[6px] border bg-white px-2 py-1 ${attempted && selectedIds.length === 0 ? "border-[#ef4444]" : "border-[#b8c0cc]"}`}>
              {selectedProducts.map((product) => (
                <span key={product.id} className="inline-flex items-center gap-1 rounded-[5px] bg-[#edf4ff] px-2 py-1 text-[11px] font-medium text-[#2d64d8]">
                  {product.name}
                  <button type="button" aria-label={`Quitar ${product.name}`} onClick={() => removeProduct(product.id)} className="text-[#7da0e8] hover:text-[#1a56db]">×</button>
                </span>
              ))}
              <input
                ref={searchRef}
                id="product-search"
                value={query}
                onFocus={() => setProductMenuOpen(true)}
                onChange={(event) => { setQuery(event.target.value); setProductMenuOpen(true); }}
                placeholder={selectedProducts.length ? "Buscar otro producto..." : "Busca y selecciona productos..."}
                className="min-w-[155px] flex-1 border-0 bg-transparent px-1 py-1 text-[12px] text-[#172033] outline-none placeholder:text-[#8b95a5]"
              />
              {productMenuOpen && (
                <div className="absolute left-0 right-0 top-[39px] z-20 max-h-48 overflow-auto rounded-[6px] border border-[#dce1e8] bg-white py-1 shadow-lg">
                  {loadingProducts ? <div className="px-3 py-2 text-[12px] text-[#6b7280]">Cargando productos...</div> : availableProducts.length === 0 ? <div className="px-3 py-2 text-[12px] text-[#6b7280]">No hay productos disponibles</div> : availableProducts.map((product) => (
                    <button type="button" key={product.id} onMouseDown={(event) => event.preventDefault()} onClick={() => addProduct(product)} className="block w-full px-3 py-2 text-left text-[12px] text-[#374151] hover:bg-[#f1f5ff]">{product.name}</button>
                  ))}
                </div>
              )}
            </div>
            {attempted && selectedIds.length === 0 && <p className="mt-1 text-[11px] font-medium text-[#dc2626]">▲ Selecciona al menos un producto.</p>}
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-[#374151]">Período</span>
            <div className="flex h-[35px] rounded-[6px] bg-[#f1f3f6] p-1">
              {[30, 90].map((days) => <button key={days} type="button" onClick={() => { setPeriod(days as 30 | 90); setPeriodMode(days as 30 | 90); setCustomPeriodOpen(false); setError(null); }} className={`rounded-[5px] px-3 text-[11px] font-semibold transition-colors ${periodMode === days ? "bg-white text-[#374151] shadow-sm" : "text-[#6b7280] hover:text-[#374151]"}`}>Últimos {days} días</button>)}
              <div className="relative">
                <button type="button" onClick={() => { setPeriodMode("custom"); setCustomPeriodOpen((open) => !open); setError(null); }} className={`flex h-full items-center gap-1 rounded-[5px] px-3 text-[11px] font-semibold transition-colors ${periodMode === "custom" ? "bg-white text-[#374151] shadow-sm" : "text-[#6b7280] hover:text-[#374151]"}`}>
                  Personalizado <PencilIcon />
                </button>
                {customPeriodOpen && <div className="absolute right-0 top-[39px] z-20 w-[132px] rounded-[6px] border border-[#dce1e8] bg-white p-2 shadow-lg">
                  <label htmlFor="custom-days" className="sr-only">Días personalizados</label>
                  <div className="flex items-center gap-1.5 rounded-[5px] border border-[#b8c0cc] px-2 focus-within:border-[#2f6df6]">
                    <input id="custom-days" autoFocus inputMode="numeric" value={customDays} onChange={(event) => setCustomDays(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="días" className="w-full min-w-0 py-1 text-[11px] text-[#172033] outline-none placeholder:text-[#8b95a5]" />
                  </div>
                  <p className="mt-1 text-[9px] text-[#8b95a5]">De 1 a 365 días</p>
                </div>}
              </div>
            </div>
          </div>

          <button type="button" onClick={generate} disabled={loadingComparison} className={`h-[35px] rounded-[6px] px-4 text-[12px] font-semibold text-white transition-colors ${loadingComparison ? "cursor-wait bg-[#9fb8e9]" : selectedIds.length ? "bg-[#2f6df6] hover:bg-[#2459d0]" : "bg-[#cbd5e1] hover:bg-[#b9c5d5]"}`}>{loadingComparison ? "Generando..." : "Generar comparación"}</button>
        </div>
      </section>

      {error && <div className="mt-4 rounded-[6px] border border-[#fecaca] bg-[#fff1f2] px-3 py-3 text-[12px] text-[#dc2626]"><strong>No se generó la comparación</strong><br />{error}</div>}
      {comparison && <ComparisonResult comparison={comparison} />}
    </div>
  );
}

function ComparisonResult({ comparison }: { comparison: PriceComparison }) {
  const hasChanges = comparison.products.some((product) => product.history.length > 0);
  return (
    <>
      {!hasChanges && <div className="mt-4 rounded-[6px] border border-[#9ec5ff] bg-[#eff6ff] px-4 py-3 text-[12px] text-[#2f6df6]"><strong>Sin variaciones en el período</strong><br />El precio de {comparison.products.length === 1 ? `«${comparison.products[0].productName}» se mantuvo constante en ${money(comparison.products[0].currentPrice)}` : "los productos seleccionados se mantuvo constante"} durante los últimos {comparison.days} días.</div>}
      <section className="mt-4 rounded-[10px] border border-[#e1e5eb] bg-white px-4 py-5 sm:px-5">
        <h2 className="mb-3 text-[12px] font-semibold text-[#273142]">Evolución del precio · últimos {comparison.days} días</h2>
        <PriceChart products={comparison.products} />
      </section>
      <ComparisonTable products={comparison.products} />
    </>
  );
}

function PriceChart({ products }: { products: ProductComparison[] }) {
  const series = products.map((product) => ({ product, values: [product.periodStartPrice, ...product.history.map((change) => change.newPrice)] }));
  const allValues = series.flatMap(({ values }) => values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const spread = Math.max(max - min, max * 0.04, 1);
  const lower = min - spread * 0.12;
  const upper = max + spread * 0.12;
  const point = (value: number, index: number, count: number) => `${28 + (index / Math.max(count - 1, 1)) * 744},${155 - ((value - lower) / (upper - lower)) * 128}`;

  return <div>
    <svg viewBox="0 0 800 180" className="h-[175px] w-full" role="img" aria-label="Evolución histórica de precios">
      {[22, 60, 98, 136].map((y) => <line key={y} x1="28" x2="772" y1={y} y2={y} stroke="#e9edf2" strokeWidth="1" />)}
      {series.map(({ product, values }, index) => <polyline key={product.productId} points={values.map((value, valueIndex) => point(value, valueIndex, values.length)).join(" ")} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#4b5563]">
      {products.map((product, index) => <span key={product.productId} className="inline-flex items-center gap-1.5"><i className="h-[2px] w-5" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{product.productName}</span>)}
    </div>
  </div>;
}

function ComparisonTable({ products }: { products: ProductComparison[] }) {
  return <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e1e5eb] bg-white">
    <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-[12px] text-[#273142]"><thead className="bg-[#f8f9fb] text-[10px] font-semibold text-[#687386]"><tr className="border-b border-[#e4e8ee]"><th className="px-3 py-3 text-left">Producto</th><th className="px-3 py-3 text-left">Precio actual</th><th className="px-3 py-3 text-left">Mínimo</th><th className="px-3 py-3 text-left">Máximo</th><th className="px-3 py-3 text-left">Promedio</th><th className="px-3 py-3 text-left">Variación</th></tr></thead><tbody>{products.map((product) => { const values = [product.periodStartPrice, ...product.history.map((change) => change.newPrice)]; const average = values.reduce((total, value) => total + value, 0) / values.length; const variation = average ? ((product.currentPrice - average) / average) * 100 : 0; return <tr key={product.productId} className="border-b border-[#eef0f3] last:border-0"><td className="px-3 py-3.5">{product.productName}</td><td className="px-3 py-3.5">{money(product.currentPrice)}</td><td className="px-3 py-3.5">{money(Math.min(...values))}</td><td className="px-3 py-3.5">{money(Math.max(...values))}</td><td className="px-3 py-3.5">{money(average)}</td><td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${variation > 0.05 ? "bg-[#d9f9e5] text-[#168044]" : variation < -0.05 ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#f1f3f5] text-[#6b7280]"}`}>{variation > 0.05 ? "↑ " : variation < -0.05 ? "↓ " : ""}{percent(variation)} {variation > 0.05 || variation < -0.05 ? "vs. promedio" : "· sin cambios"}</span></td></tr>; })}</tbody></table></div>
  </div>;
}

function PencilIcon() { return <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.9 2.1 3 3-8.6 8.6-3.3.4.4-3.3 8.5-8.7Z" /><path d="m9.2 3.8 3 3" /></svg>; }