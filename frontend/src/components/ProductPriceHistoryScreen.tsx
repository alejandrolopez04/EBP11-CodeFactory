import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchPriceHistory, type ApiPriceChange, type ApiPriceHistory, type TriggerType } from "../api/client";
import LoadingScreen from "./LoadingScreen";
import { triggerText } from "../utils/triggerText";
import DateRangePicker, { PRESETS, rangeFor, type DateRange, type RangePreset } from "./DateRangePicker";
import { fetchPriceHistory } from "../api/client";
/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CREATION = "creation" as const;
type BarKey = number | typeof CREATION; // traceId del cambio o el registro de creación

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}k` : fmt(n);
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { month: "short" }).replace(".", "");
const dayKey = (iso: string) => new Date(iso).toDateString();
const pct = (from: number, to: number) => (from ? ((to - from) / from) * 100 : 0);

/** Texto de respaldo cuando una traza no trae explicación de la causa. */
const TRIGGER_LABELS: Record<TriggerType, string> = {
  REGLA: "Cambio en reglas",
  VARIABLES: "Cambio en variables de negocio",
  HORARIO: "Cambio de horario",
  PRODUCTO: "Producto actualizado",
  MANUAL: "Recálculo manual",
  INICIO: "Arranque del sistema",
};
const causeOf = (c: ApiPriceChange) =>
  (c.trigger && triggerText(c.trigger)) || (c.triggerType ? TRIGGER_LABELS[c.triggerType] : "Sin causa registrada");

const TYPE_LABELS: Record<NonNullable<ApiPriceChange["changeType"]>, string> = {
  HORARIO: "Horario",
  DEMANDA: "Demanda",
  DISPONIBILIDAD: "Disponibilidad",
};
const TYPE_ORDER = ["Horario", "Demanda", "Disponibilidad", "Sin regla", "Creación"];

const ruleCode = (id: number) => `RGL-${String(id).padStart(3, "0")}`;

/** Una barra de la gráfica y su fila en la lista: un cambio o el registro de creación. */
interface Entry {
  key: BarKey;
  price: number;
  at: string | null;
  change: ApiPriceChange | null;
}

type Grouping = "none" | "date" | "type";

const STORAGE = { grouping: "priceHistory.grouping", range: "priceHistory.range" };

function readStored<T extends string | number>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    const match = allowed.find((v) => String(v) === raw);
    return match ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string | number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Preferencia opcional: si el almacenamiento no está disponible se ignora
  }
}

/* ------------------------------------------------------------------ */
/*  Pantalla                                                           */
/* ------------------------------------------------------------------ */

export default function ProductPriceHistoryScreen({ productId, onBack }: { productId: number; onBack: () => void }) {
  const [history, setHistory] = useState<ApiPriceHistory | null>(null);
  // El rango predefinido se recuerda; se recalcula al entrar para que "Últimos 30 días" siempre termine hoy
  const [range, setRange] = useState<DateRange>(() => rangeFor(readStored<RangePreset>(STORAGE.range, PRESETS, "all")));
  const [grouping, setGrouping] = useState<Grouping>(() =>
    readStored<Grouping>(STORAGE.grouping, ["none", "date", "type"], "none")
  );
  const [selected, setSelected] = useState<BarKey | null>(null);
  const [newestFirst, setNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Evita que una respuesta vieja pise a la más reciente al cambiar de página rápido
  const requestId = useRef(0);
  const rowRefs = useRef(new Map<BarKey, HTMLDivElement>());

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPriceHistory(productId, range.from ?? undefined, range.to ?? undefined);
      if (id !== requestId.current) return;
      setHistory(data);
      setSelected(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "No se pudo cargar el historial de precios.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [productId, range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  // La creación aparece si cae dentro del rango y no quedó fuera por el tope de cambios
  const creationInRange =
    !!history &&
    !history.truncated &&
    (!history.creation.at ||
      ((!history.from || history.creation.at.slice(0, 10) >= history.from) &&
        (!history.to || history.creation.at.slice(0, 10) <= history.to)));

  // Orden cronológico (izquierda = más antiguo)
  const entries = useMemo<Entry[]>(() => {
    if (!history) return [];
    const list: Entry[] = [...history.changes]
      .reverse()
      .map((c) => ({ key: c.traceId, price: c.newPrice, at: c.at, change: c }));
    if (creationInRange) {
      list.unshift({ key: CREATION, price: history.creation.basePrice, at: history.creation.at, change: null });
    }
    return list;
  }, [history, creationInRange]);

  const select = useCallback((key: BarKey, scroll: boolean) => {
    setSelected(key);
    if (scroll) rowRefs.current.get(key)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  // Esc quita la selección; ← / → recorren las barras
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (entries.length === 0) return;
      const index = entries.findIndex((en) => en.key === selected);
      const next =
        index === -1 ? entries[entries.length - 1] : entries[index + (e.key === "ArrowLeft" ? -1 : 1)];
      if (next) {
        e.preventDefault();
        select(next.key, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entries, selected, select]);

  if (loading && !history) {
    return <LoadingScreen label="Cargando historial de precios…" />;
  }
  if (error && !history) {
    return (
      <div className="h-full flex flex-col">
        <LoadingScreen label="No se pudo cargar el historial" error={error} />
        <div className="flex justify-center gap-3 pb-12">
          <button onClick={onBack} className="px-3 py-1.5 text-[12px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
            ← Volver
          </button>
          <button onClick={() => void load()} className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#1a56db] rounded-[6px] hover:bg-[#1648c0] transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  if (!history) return null;

  const current = history.currentPrice ?? history.basePrice;
  const variation = pct(history.basePrice, current);
  // entries está en orden cronológico; la tabla puede mostrarse en cualquiera de los dos sentidos
  const rows = newestFirst ? [...entries].reverse() : entries;

  return (
    <div className="p-8 min-h-full" onClick={() => setSelected(null)}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12px] font-medium text-[#6b7280] hover:text-[#1a56db] transition-colors mb-5"
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Historial de precios</div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0f1117] font-display">{history.productName}</h1>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            history.productStatus === "ACTIVE" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f1f3f7] text-[#6b7280]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${history.productStatus === "ACTIVE" ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
            {history.productStatus === "ACTIVE" ? "Activo" : "Inactivo"}
          </span>
        </div>
        <span className="font-mono text-[12px] text-[#9ca3af] mt-1 block">SKU: {history.sku}</span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <MetricCard label="Precio actual" value={fmt(current)} valueClass="text-[#1a56db]" />
        <MetricCard label="Cambios registrados" value={String(history.totalChanges)} />
        <MetricCard label="Alzas" value={`▲ ${history.increases}`} valueClass="text-[#16a34a]" />
        <MetricCard label="Bajas" value={`▼ ${history.decreases}`} valueClass="text-[#dc2626]" />
        <MetricCard
          label="Frente al precio base"
          value={`${variation > 0 ? "+" : ""}${variation.toFixed(1)}%`}
          sub={`Base ${fmt(history.basePrice)}`}
          valueClass={variation > 0 ? "text-[#16a34a]" : variation < 0 ? "text-[#dc2626]" : "text-[#0f1117]"}
        />
      </div>

      {/* Gráfica */}
      <div className="bg-white border border-[#e2e6ed] rounded-[8px] p-5 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#0f1117]">Evolución del precio</h2>
            <p className="text-[12px] text-[#6b7280]">
              Cada barra es un cambio de precio y su altura es el precio resultante. Selecciona una para ver el detalle.
            </p>
          </div>
          <DateRangePicker
            value={range}
            onChange={(r) => {
              setRange(r);
              if (r.preset !== "custom") writeStored(STORAGE.range, r.preset);
            }}
          />
        </div>

        <PriceBarChart
          entries={entries}
          selected={selected}
          onSelect={(key) => select(key, true)}
          dimmed={loading}
        />

        <div className="mt-3 text-[12px] text-[#6b7280]">
          {history.totalChanges === 0 ? (
            // Producto que nunca ha cambiado de precio, sin importar el rango elegido
            "No hay variaciones de precio registradas."
          ) : history.rangeChanges === 0 ? (
            "No hubo cambios de precio en este rango."
          ) : (
            <>
              <span className="font-semibold text-[#0f1117]">{history.rangeChanges}</span>{" "}
              {history.rangeChanges === 1 ? "cambio" : "cambios"} en el rango
              {history.truncated && <> · se muestran los {history.changes.length} más recientes</>}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">{error}</div>
      )}

      {/* Lista de cambios */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-semibold text-[#374151]">Detalle de cambios</h2>
        <MenuSelect
          label="Agrupar"
          value={grouping}
          options={[
            { value: "none", label: "Ninguno" },
            { value: "date", label: "Fecha" },
            { value: "type", label: "Tipo" },
          ]}
          onChange={(g) => {
            setGrouping(g);
            writeStored(STORAGE.grouping, g);
          }}
        />
      </div>

      <div className={`bg-white border border-[#e2e6ed] rounded-[8px] overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
        <div className="min-w-[720px]">
          <div className={`${GRID} px-5 py-3 border-b border-[#e2e6ed] bg-[#f8f9fb] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide`}>
            <span className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewestFirst(!newestFirst);
                }}
                aria-label={newestFirst ? "Ordenar del más antiguo al más reciente" : "Ordenar del más reciente al más antiguo"}
                title={newestFirst ? "Más recientes primero" : "Más antiguos primero"}
                className="p-1 -ml-1 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {newestFirst ? <path d="M8 3v10M4 9l4 4 4-4" /> : <path d="M8 13V3M4 7l4-4 4 4" />}
                </svg>
              </button>
              {grouping === "date" ? "Hora" : "Fecha y hora"}
            </span>
            <span>Cambio</span>
            <span>Causa</span>
            <span>Reglas aplicadas</span>
          </div>

          {groupRows(rows, grouping).map((group) => (
            <div key={group.key}>
              {group.label && (
                <div className="px-5 pt-4 pb-2 border-b border-[#e2e6ed]">
                  <span className="text-[13px] font-bold text-[#0f1117]">{group.label}</span>
                  <span className="ml-1.5 text-[12px] text-[#9ca3af]">
                    · {group.rows.length} {group.rows.length === 1 ? "registro" : "registros"}
                  </span>
                </div>
              )}
              {group.rows.map((entry) => (
                <HistoryRow
                  key={entry.key}
                  entry={entry}
                  timeOnly={grouping === "date"}
                  isSelected={selected === entry.key}
                  onSelect={() => select(entry.key, false)}
                  rowRef={(el) => (el ? rowRefs.current.set(entry.key, el) : rowRefs.current.delete(entry.key))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Agrupa las filas conservando el orden (más reciente primero). */
function groupRows(rows: Entry[], grouping: Grouping): { key: string; label: string | null; rows: Entry[] }[] {
  if (grouping === "none") return [{ key: "all", label: null, rows }];
  const groups = new Map<string, { key: string; label: string; rows: Entry[] }>();
  for (const row of rows) {
    let key: string;
    let label: string;
    if (grouping === "date") {
      key = row.at ? dayKey(row.at) : "sin-fecha";
      label = row.at ? fmtDate(row.at) : "Sin fecha";
    } else {
      key = row.change ? (row.change.changeType ? TYPE_LABELS[row.change.changeType] : "Sin regla") : "Creación";
      label = key;
    }
    if (!groups.has(key)) groups.set(key, { key, label, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  const list = [...groups.values()];
  return grouping === "type" ? list.sort((a, b) => TYPE_ORDER.indexOf(a.key) - TYPE_ORDER.indexOf(b.key)) : list;
}

/* ------------------------------------------------------------------ */
/*  Piezas                                                             */
/* ------------------------------------------------------------------ */

function MetricCard({ label, value, sub, valueClass = "text-[#0f1117]" }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e2e6ed] p-5">
      <div className="text-[13px] text-[#6b7280] mb-1">{label}</div>
      <div className={`text-[26px] font-bold font-display leading-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-[12px] text-[#9ca3af] mt-1">{sub}</div>}
    </div>
  );
}

const CHART_HEIGHT = 180;
const Y_AXIS_WIDTH = 56;

function PriceBarChart({
  entries,
  selected,
  onSelect,
  dimmed,
}: {
  entries: Entry[];
  selected: BarKey | null;
  onSelect: (key: BarKey) => void;
  dimmed: boolean;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const [hovered, setHovered] = useState<BarKey | null>(null);

  // El ancho real decide qué etiquetas de fecha caben sin amontonarse.
  // Se vuelve a medir cuando el área de barras aparece (un rango sin cambios no la dibuja).
  const isEmpty = entries.length === 0;
  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setPlotWidth(el.clientWidth));
    observer.observe(el);
    setPlotWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [isEmpty]);

  if (entries.length === 0) {
    return <div className="h-[180px] flex items-center justify-center text-[13px] text-[#9ca3af]">Sin datos para graficar</div>;
  }

  // Eje Y: parte un poco por debajo del mínimo para que las diferencias se vean sin exagerarlas
  const prices = entries.map((e) => e.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const floor = max === min ? max * 0.5 : Math.max(0, min - (max - min) * 0.5);
  const heightOf = (price: number) => ((price - floor) / (max - floor)) * 100;
  const ticks = [max, (max + floor) / 2, floor];

  // Una columna por cambio: las barras se reparten en todo el ancho, sin espacios vacíos
  const slots = entries.length;
  const slotWidth = plotWidth / slots;

  // Franjas de fecha: barras consecutivas del mismo día comparten una sola etiqueta
  const segments: { start: number; span: number; at: string | null; showMonth: boolean }[] = [];
  entries.forEach((e, i) => {
    const last = segments[segments.length - 1];
    if (last && e.at && last.at && dayKey(last.at) === dayKey(e.at)) {
      last.span++;
    } else {
      const prevAt = last?.at;
      const showMonth = !prevAt || !e.at || new Date(prevAt).getMonth() !== new Date(e.at).getMonth();
      segments.push({ start: i, span: 1, at: e.at, showMonth });
    }
  });

  const tooltipKey = hovered ?? selected;
  const tooltipIndex = entries.findIndex((e) => e.key === tooltipKey);

  return (
    <div className={`transition-opacity ${dimmed ? "opacity-50" : ""}`}>
      <div className="flex">
        {/* Eje Y */}
        <div className="relative shrink-0" style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}>
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute right-2 -translate-y-1/2 text-[10px] font-mono text-[#9ca3af]"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              {fmtCompact(t)}
            </span>
          ))}
        </div>

        {/* Área de barras */}
        <div ref={plotRef} className="relative flex-1 min-w-0" style={{ height: CHART_HEIGHT }}>
          {ticks.map((_, i) => (
            <div
              key={i}
              className={`absolute inset-x-0 ${i === ticks.length - 1 ? "border-t border-[#e2e6ed]" : "border-t border-dashed border-[#f1f3f7]"}`}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 grid items-end" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
            {entries.map((e, i) => {
              const isSelected = e.key === selected;
              return (
                <div
                  key={String(e.key)}
                  className="h-full flex items-end justify-center"
                  style={{ gridColumnStart: i + 1 }}
                  onMouseEnter={() => setHovered(e.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelect(e.key);
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${e.change ? "Cambio" : "Creación"}: ${fmt(e.price)}${e.at ? `, ${fmtDate(e.at)} ${fmtTime(e.at)}` : ""}`}
                    className={`w-[60%] max-w-[40px] min-w-[2px] rounded-t-[2px] transition-colors ${
                      isSelected ? "bg-[#1a56db]" : "bg-[#d1d5db] hover:bg-[#9ca3af]"
                    }`}
                    style={{ height: `${heightOf(e.price)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {tooltipIndex !== -1 && (
            <ChartTooltip
              entry={entries[tooltipIndex]}
              leftPx={(tooltipIndex + 0.5) * slotWidth}
              bottomPct={heightOf(entries[tooltipIndex].price)}
              plotWidth={plotWidth}
              emphasized={entries[tooltipIndex].key === selected}
            />
          )}
        </div>
      </div>

      {/* Franjas de fecha: una etiqueta por día, con el mes solo cuando cambia */}
      <div className="flex mt-1.5">
        <div className="shrink-0" style={{ width: Y_AXIS_WIDTH }} />
        <div className="relative flex-1 min-w-0 h-8 grid" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
          {segments.map((s) => {
            const width = s.span * slotWidth;
            const label = s.at ? (s.showMonth ? `${new Date(s.at).getDate()} ${fmtMonth(s.at)}` : String(new Date(s.at).getDate())) : "Inicio";
            const fits = width >= label.length * 6 + 6;
            const hasSelection = entries.slice(s.start, s.start + s.span).some((e) => e.key === selected);
            return (
              <div
                key={s.start}
                className="border-l border-[#e2e6ed] pl-1 pt-0.5 overflow-hidden"
                style={{ gridColumn: `${s.start + 1} / span ${s.span}` }}
                title={s.at ? fmtDate(s.at) : "Creación"}
              >
                {fits && (
                  <span className={`block text-[10px] font-mono whitespace-nowrap ${hasSelection ? "text-[#1a56db] font-semibold" : "text-[#9ca3af]"}`}>
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Detalle de la barra seleccionada o bajo el mouse. */
function ChartTooltip({
  entry,
  leftPx,
  bottomPct,
  plotWidth,
  emphasized,
}: {
  entry: Entry;
  leftPx: number;
  bottomPct: number;
  plotWidth: number;
  emphasized: boolean;
}) {
  const c = entry.change;
  const variation = c ? pct(c.previousPrice, c.newPrice) : 0;
  // Cerca de los bordes el tooltip se ancla hacia dentro para no salirse del panel
  const anchor = leftPx < 90 ? "translate-x-0" : leftPx > plotWidth - 90 ? "-translate-x-full" : "-translate-x-1/2";

  return (
    <div
      className={`absolute z-10 ${anchor} px-2.5 py-1.5 bg-white border rounded-[6px] whitespace-nowrap pointer-events-none ${
        emphasized ? "border-[#1a56db] shadow-md" : "border-[#e2e6ed] shadow-sm"
      }`}
      style={{ left: leftPx, bottom: `calc(${Math.min(bottomPct, 100)}% + 8px)` }}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0f1117]">
        <span className={`w-2 h-2 rounded-full ${emphasized ? "bg-[#1a56db]" : "bg-[#9ca3af]"}`} />
        {fmt(entry.price)}
        {c && variation !== 0 && (
          <span className={variation > 0 ? "text-[#16a34a]" : "text-[#dc2626]"}>
            {variation > 0 ? "▲" : "▼"} {Math.abs(variation).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-[11px] text-[#9ca3af]">
        {c ? causeOf(c) : "Producto creado"}
        {entry.at ? ` · ${fmtDate(entry.at)}, ${fmtTime(entry.at)}` : ""}
      </div>
    </div>
  );
}

const GRID = "grid grid-cols-[130px_240px_minmax(0,1fr)_150px] gap-4 items-center";
const rowSelected = "relative z-[1] bg-white shadow-[inset_3px_0_0_#1a56db,0_6px_20px_rgba(15,17,23,0.10)]";

function HistoryRow({
  entry,
  timeOnly,
  isSelected,
  onSelect,
  rowRef,
}: {
  entry: Entry;
  timeOnly: boolean;
  isSelected: boolean;
  onSelect: () => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const c = entry.change;
  const cause = c ? causeOf(c) : "Producto creado · precio base inicial";
  const rules = c ? (c.appliedRuleIds.length > 0 ? c.appliedRuleIds.map(ruleCode).join(", ") : "Ninguna") : "—";

  return (
    <div
      ref={rowRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-selected={isSelected}
      className={`${GRID} px-5 py-3 border-b border-[#f1f3f7] cursor-pointer transition-all ${isSelected ? rowSelected : "hover:bg-[#f8f9fb]"}`}
    >
      <div>
        {entry.at ? (
          timeOnly ? (
            <div className="text-[13px] font-mono text-[#374151]">{fmtTime(entry.at)}</div>
          ) : (
            <>
              <div className="text-[13px] font-medium text-[#0f1117]">{fmtDate(entry.at)}</div>
              <div className="text-[11px] font-mono text-[#9ca3af]">{fmtTime(entry.at)}</div>
            </>
          )
        ) : (
          <span className="text-[13px] text-[#9ca3af]">—</span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 text-[13px] whitespace-nowrap overflow-hidden">
        {c ? (
          <>
            <span className="text-[#9ca3af]">{fmt(c.previousPrice)}</span>
            <span className="text-[#9ca3af]">→</span>
            <span className="font-semibold text-[#0f1117]">{fmt(c.newPrice)}</span>
            {(c.clampedToMax || c.clampedToMin) && (
              <span className="text-[11px] font-medium text-[#b45309]">{c.clampedToMax ? "(tope máx.)" : "(tope mín.)"}</span>
            )}
          </>
        ) : (
          <span className="font-semibold text-[#0f1117]">{fmt(entry.price)}</span>
        )}
      </div>

      <div className="min-w-0">
        <span
          className="inline-flex max-w-full items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f1f3f7] text-[#374151]"
          title={cause}
        >
          <span className="truncate">{cause}</span>
        </span>
      </div>

      <div className="font-mono text-[11px] text-[#6b7280] truncate" title={rules}>
        {rules}
      </div>
    </div>
  );
}

/** Botón con menú desplegable (✓ en la opción activa), usado para "Mostrar" y "Agrupar". */
function MenuSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; short?: string }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] bg-white border border-[#e2e6ed] rounded-[6px] hover:bg-[#f8f9fb] transition-colors"
      >
        <span className="text-[#6b7280]">{label}:</span>
        <span className="font-semibold text-[#0f1117]">{current.short ?? current.label}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 z-20 mt-1 w-44 py-1 bg-white border border-[#e2e6ed] rounded-[8px] shadow-lg">
          {options.map((option) => (
            <li key={String(option.value)}>
              <button
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#0f1117] hover:bg-[#f1f3f7] text-left"
              >
                <span className="w-4 text-[#1a56db]">{option.value === value ? "✓" : ""}</span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
