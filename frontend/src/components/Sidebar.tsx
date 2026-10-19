import type { Screen } from "../App";
import { useProfile } from "../auth/ProfileContext";
import { ROLE_LABELS } from "../api/profile";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: GridIcon },
  { id: "products", label: "Productos", icon: BoxIcon },
  { id: "rules", label: "Reglas de Pricing", icon: RulesIcon },
  { id: "variables", label: "Variables de Negocio", icon: SlidersIcon },
  { id: "history", label: "Historial de Precios", icon: HistoryIcon },
] as const;

export default function Sidebar({ 
  active, 
  onNavigate, 
  isCollapsed, 
  toggleSidebar 
}: { 
  active: Screen; 
  onNavigate: (s: Screen) => void; 
  isCollapsed: boolean; 
  toggleSidebar: () => void; 
}) {

    const { profiles, current, switchProfile } = useProfile();
    const initials = current
        ? current.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")
        : "?";


    return (
    <aside className={`bg-white border-r border-[#e2e6ed] flex flex-col shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}>
      
      {/* HEADER */}
      <div className={`py-5 border-b border-[#e2e6ed] flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-5 justify-between'}`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src="/favicon.svg" alt="Pricing Engine" className="w-7 h-7 shrink-0"/>
          {!isCollapsed && (
            <div className="whitespace-nowrap">
              <div className="text-[13px] font-semibold text-[#0f1117] font-display leading-tight">Pricing Engine</div>
              <div className="text-[10px] text-[#6b7280] font-medium">Motor Dinámico</div>
            </div>
          )}
        </div>
        
        {/* Botón para colapsar (solo visible cuando está expandido) */}
        {!isCollapsed && (
          <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Botón para expandir (solo visible cuando está colapsado) */}
      {isCollapsed && (
        <button onClick={toggleSidebar} className="mt-4 mx-auto text-gray-400 hover:text-gray-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id as Screen)}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center rounded-[6px] text-left transition-all text-[13px] font-medium ${
                isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? "bg-[#1a56db] text-white"
                  : "text-[#374151] hover:bg-[#f1f3f7] hover:text-[#0f1117]"
              }`}
            >
              <Icon size={16} active={isActive} />
              {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
            </button>
          );
        })}
      </nav>

        {/* FOOTER (Perfil activo + switch) */}
        <div className={`py-4 border-t border-[#e2e6ed] flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
            <div
                className="w-7 h-7 rounded-full bg-[#e8ecf2] flex items-center justify-center shrink-0"
                title={isCollapsed && current ? `${current.fullName} · ${ROLE_LABELS[current.role]}` : undefined}
            >
                <span className="text-[11px] font-semibold text-[#374151] font-display">{initials}</span>
            </div>
            {!isCollapsed && (
                <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[#0f1117] truncate">
                        {current?.fullName ?? "Sin perfil"}
                    </div>
                    <select
                        aria-label="Cambiar perfil"
                        value={current?.id ?? ""}
                        onChange={(e) => switchProfile(Number(e.target.value))}
                        className="mt-0.5 w-full text-[10px] text-[#6b7280] bg-transparent border border-[#e2e6ed] rounded-[4px] px-1 py-0.5 cursor-pointer hover:border-[#1a56db] focus:outline-none focus:border-[#1a56db]"
                    >
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>{ROLE_LABELS[p.role]}</option>
                        ))}
                    </select>
                </div>
            )}
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