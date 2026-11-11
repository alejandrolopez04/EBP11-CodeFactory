import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Rangos                                                             */
/* ------------------------------------------------------------------ */

export type RangePreset =
  | "last7" | "last30" | "last60" | "last90" | "last365"
  | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear"
  | "all";

export interface DateRange {
  preset: RangePreset | "custom";
  /** "YYYY-MM-DD", inclusivo; null = sin límite */
  from: string | null;
  to: string | null;
}

const PRESET_LABELS: Record<RangePreset, string> = {
  last7: "Últimos 7 días",
  last30: "Últimos 30 días",
  last60: "Últimos 60 días",
  last90: "Últimos 90 días",
  last365: "Últimos 365 días",
  thisWeek: "Esta semana",
  lastWeek: "Semana pasada",
  thisMonth: "Este mes",
  lastMonth: "Mes pasado",
  thisYear: "Este año",
  lastYear: "Año pasado",
  all: "Todo el historial",
};

const SECTIONS: { title: string; presets: RangePreset[] }[] = [
  { title: "Móviles", presets: ["last7", "last30", "last60", "last90", "last365"] },
  { title: "Calendario", presets: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "lastYear"] },
  { title: "Otro", presets: ["all"] },
];

export const PRESETS = Object.keys(PRESET_LABELS) as RangePreset[];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Lunes de la semana de d */
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

/** Calcula las fechas de un rango predefinido a partir de hoy. */
export function rangeFor(preset: RangePreset): DateRange {
  const today = new Date();
  const days = (n: number) => ({ preset, from: iso(addDays(today, -(n - 1))), to: iso(today) });
  switch (preset) {
    case "last7": return days(7);
    case "last30": return days(30);
    case "last60": return days(60);
    case "last90": return days(90);
    case "last365": return days(365);
    case "thisWeek": return { preset, from: iso(startOfWeek(today)), to: iso(today) };
    case "lastWeek": {
      const start = addDays(startOfWeek(today), -7);
      return { preset, from: iso(start), to: iso(addDays(start, 6)) };
    }
    case "thisMonth": return { preset, from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
    case "lastMonth":
      return {
        preset,
        from: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: iso(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case "thisYear": return { preset, from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) };
    case "lastYear":
      return { preset, from: iso(new Date(today.getFullYear() - 1, 0, 1)), to: iso(new Date(today.getFullYear() - 1, 11, 31)) };
    case "all": return { preset, from: null, to: null };
  }
}

const fmtDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

export function rangeLabel(range: DateRange): string {
  if (range.preset !== "custom") return PRESET_LABELS[range.preset];
  return `${range.from ? fmtDay(range.from) : "Inicio"} – ${range.to ? fmtDay(range.to) : "Hoy"}`;
}

/* ------------------------------------------------------------------ */
/*  Selector                                                           */
/* ------------------------------------------------------------------ */

/** Botón que muestra el rango actual y abre el selector de rango de fechas. */
export default function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] bg-white border border-[#e2e6ed] rounded-[6px] hover:bg-[#f8f9fb] transition-colors shrink-0"
      >
        <CalendarIcon />
        <span className="font-semibold text-[#0f1117]">{rangeLabel(value)}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <DateRangeModal
          value={value}
          onClose={() => setOpen(false)}
          onApply={(range) => {
            onChange(range);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function DateRangeModal({
  value,
  onClose,
  onApply,
}: {
  value: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}) {
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? rangeFor("last30").to!);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const applyCustom = () => {
    if (!from || !to) {
      setError("Elige la fecha inicial y la final.");
      return;
    }
    if (from > to) {
      setError("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    onApply({ preset: "custom", from, to });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar rango de fechas"
        className="w-full max-w-[640px] max-h-full overflow-y-auto bg-white rounded-[10px] border border-[#e2e6ed] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e6ed]">
          <h3 className="text-[16px] font-bold text-[#0f1117] font-display">Seleccionar rango de fechas</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-[6px] text-[#6b7280] hover:bg-[#f1f3f7] hover:text-[#0f1117] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-5">
              <div className="text-[12px] font-semibold text-[#374151] mb-2">{section.title}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {section.presets.map((preset) => {
                  const active = value.preset === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => onApply(rangeFor(preset))}
                      aria-pressed={active}
                      className={`px-3 py-2 text-left text-[13px] rounded-[6px] border transition-colors ${
                        active
                          ? "bg-[#1a56db] border-[#1a56db] text-white font-semibold"
                          : "bg-white border-[#e2e6ed] text-[#374151] hover:bg-[#f1f3f7]"
                      }`}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#e2e6ed]" />
            <span className="text-[12px] text-[#9ca3af]">o</span>
            <div className="flex-1 h-px bg-[#e2e6ed]" />
          </div>

          <div className="text-[12px] font-semibold text-[#374151] mb-2">Personalizado</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="block text-[11px] text-[#6b7280] mb-1">Desde</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] text-[#6b7280] mb-1">Hasta</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
            </label>
          </div>
          {error && <p className="mb-3 text-[12px] text-[#dc2626]">{error}</p>}
          <button
            onClick={applyCustom}
            className={`w-full py-2.5 text-[13px] font-semibold rounded-[6px] transition-colors ${
              value.preset === "custom"
                ? "bg-[#1a56db] text-white hover:bg-[#1648c0]"
                : "bg-white text-[#1a56db] border border-[#1a56db] hover:bg-[#eef4ff]"
            }`}
          >
            Aplicar rango personalizado
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}
