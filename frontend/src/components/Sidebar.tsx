import type { Screen } from "../App";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: GridIcon },
  { id: "products", label: "Productos", icon: BoxIcon },
  { id: "rules", label: "Reglas de Pricing", icon: RulesIcon },
  { id: "variables", label: "Variables de Negocio", icon: SlidersIcon },
  { id: "history", label: "Historial de Precios", icon: HistoryIcon },
] as const;

export default function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <aside className="w-60 bg-white border-r border-[#e2e6ed] flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-[#e2e6ed]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1a56db] flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">P</span>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#0f1117] font-display leading-tight">PricingEngine</div>
            <div className="text-[10px] text-[#6b7280] font-medium">Motor Dinámico</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id as Screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-left transition-all text-[13px] font-medium ${
                isActive
                  ? "bg-[#1a56db] text-white"
                  : "text-[#374151] hover:bg-[#f1f3f7] hover:text-[#0f1117]"
              }`}
            >
              <Icon size={16} active={isActive} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-[#e2e6ed]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#e8ecf2] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[#374151] font-display">AM</span>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#0f1117]">Ana Martínez</div>
            <div className="text-[10px] text-[#6b7280]">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function GridIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill={active ? "white" : "#9ca3af"} />
      <rect x="9" y="1" width="6" height="6" rx="1" fill={active ? "white" : "#9ca3af"} />
      <rect x="1" y="9" width="6" height="6" rx="1" fill={active ? "white" : "#9ca3af"} />
      <rect x="9" y="9" width="6" height="6" rx="1" fill={active ? "white" : "#9ca3af"} />
    </svg>
  );
}

function BoxIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" />
      <path d="M8 2v12M2 5l6 3 6-3" />
    </svg>
  );
}

function RulesIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h8M2 12h5" />
    </svg>
  );
}

function SlidersIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M5 8h6M7 12h2" />
      <circle cx="5" cy="4" r="1.5" fill={active ? "white" : "#9ca3af"} stroke="none" />
      <circle cx="8" cy="8" r="1.5" fill={active ? "white" : "#9ca3af"} stroke="none" />
      <circle cx="11" cy="12" r="1.5" fill={active ? "white" : "#9ca3af"} stroke="none" />
    </svg>
  );
}

function HistoryIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 1.5-3.9" />
      <path d="M2 3v3.5L5.5 8" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  );
}
