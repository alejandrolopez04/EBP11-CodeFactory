import { useEffect, useRef, useState } from "react";
import type { Screen } from "../App";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS } from "../api/auth";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: GridIcon },
  { id: "products", label: "Productos", icon: BoxIcon },
  { id: "rules", label: "Reglas de Pricing", icon: RulesIcon },
  { id: "variables", label: "Variables de Negocio", icon: SlidersIcon },
  { id: "simulation", label: "Simulación", icon: FlaskIcon },
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

    const { current, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const initials = current
        ? current.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")
        : "?";
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileTriggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isProfileMenuOpen) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!profileMenuRef.current?.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsProfileMenuOpen(false);
                profileTriggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isProfileMenuOpen]);

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

        {/* FOOTER (usuario con sesión + cerrar sesión) */}
        <div className={`border-t border-[#e2e6ed] ${isCollapsed ? 'flex justify-center py-4' : 'p-3'}`}>
          <div className={`relative ${isCollapsed ? '' : 'w-full'}`} ref={profileMenuRef}>
            {isProfileMenuOpen && (
              <div
                id="profile-menu"
                role="menu"
                aria-label="Cuenta"
                className={`absolute z-30 overflow-hidden rounded-xl border border-[#e2e6ed] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.28)] ${
                  isCollapsed ? 'bottom-0 left-full ml-3 w-56' : 'bottom-full left-0 mb-2 w-full'
                }`}
              >
                <div className="px-2.5 pb-2 pt-2">
                  <div className="truncate text-[11px] font-semibold text-[#0f1117]">{current?.fullName}</div>
                  <div className="mt-0.5 truncate text-[10px] text-[#6b7280]">{current?.email}</div>
                  {current && (
                    <span className="mt-1.5 inline-block rounded-full bg-[#eef3fd] px-2 py-0.5 text-[10px] font-medium text-[#1a56db]">
                      {ROLE_LABELS[current.role]}
                    </span>
                  )}
                </div>
                <div className="my-1 border-t border-[#f1f3f7]" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={isLoggingOut}
                  onClick={async () => {
                    setIsLoggingOut(true);
                    await logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:opacity-60"
                >
                  <LogoutIcon />
                  {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
              </div>
            )}
            <button
              ref={profileTriggerRef}
              type="button"
              aria-label={`Cuenta de ${current?.fullName ?? "usuario"}`}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-menu"
              title={isCollapsed && current ? `${current.fullName} · ${ROLE_LABELS[current.role]}` : undefined}
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className={isCollapsed
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf1ff] text-[#1a56db] transition-shadow hover:ring-2 hover:ring-[#1a56db]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db]/30"
                : "group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db]/30"}
            >
              {isCollapsed ? (
                <span className="text-[11px] font-semibold font-display">{initials}</span>
              ) : (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-[11px] font-semibold text-[#1a56db] ring-1 ring-inset ring-[#1a56db]/10">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-[#0f1117]">{current?.fullName}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#6b7280]">
                      {current ? ROLE_LABELS[current.role] : ""}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-hover:text-[#6b7280] ${isProfileMenuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m4 10 4-4 4 4" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
    </aside>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6" />
      <path d="M10.5 11 13.5 8l-3-3M13.5 8H6" />
    </svg>
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

function FlaskIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={active ? "white" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h4M6.5 2v4L3 12.5A1 1 0 0 0 3.9 14h8.2a1 1 0 0 0 .9-1.5L9.5 6V2" />
      <path d="M4.5 10h7" />
    </svg>
  );
}
