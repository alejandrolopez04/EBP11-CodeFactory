import { useEffect, useRef, useState } from "react";
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

        {/* FOOTER (Perfil activo + switch) */}
        <div className={`border-t border-[#e2e6ed] ${isCollapsed ? 'flex justify-center py-4' : 'p-3'}`}>
          {isCollapsed ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf1ff] text-[#1a56db]"
              title={current ? `${current.fullName} · ${ROLE_LABELS[current.role]}` : "Sin perfil"}
            >
              <span className="text-[11px] font-semibold font-display">{initials}</span>
            </div>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              {isProfileMenuOpen && (
                <div
                  id="profile-menu"
                  role="group"
                  aria-label="Perfiles disponibles"
                  className="absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl border border-[#e2e6ed] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.28)]"
                >
                  <div className="px-2.5 pb-1.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    Cambiar perfil
                  </div>
                  {profiles.length === 0 ? (
                    <div className="px-2.5 py-2 text-[11px] text-[#6b7280]">No hay perfiles disponibles</div>
                  ) : profiles.map((profile) => {
                    const isCurrent = profile.id === current?.id;
                    const profileInitials = profile.fullName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("");

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        aria-pressed={isCurrent}
                        onClick={() => {
                          switchProfile(profile.id);
                          setIsProfileMenuOpen(false);
                          profileTriggerRef.current?.focus();
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                          isCurrent ? "bg-[#f1f5ff]" : "hover:bg-[#f8fafc]"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isCurrent ? "bg-[#dbeafe] text-[#1a56db]" : "bg-[#f1f3f7] text-[#6b7280]"
                        }`}>
                          {profileInitials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[11px] font-medium ${isCurrent ? "text-[#1a56db]" : "text-[#374151]"}`}>
                            {profile.fullName}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-[#9ca3af]">
                            {ROLE_LABELS[profile.role]}
                          </span>
                        </span>
                        {isCurrent && (
                          <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-[#1a56db]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3.5 8.5 3 3 6-7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                ref={profileTriggerRef}
                type="button"
                aria-label={`Perfil actual: ${current?.fullName ?? "Sin perfil"}. Cambiar perfil`}
                aria-expanded={isProfileMenuOpen}
                aria-controls="profile-menu"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db]/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-[11px] font-semibold text-[#1a56db] ring-1 ring-inset ring-[#1a56db]/10">
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-[#0f1117]">
                    {current?.fullName ?? "Sin perfil"}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-[#6b7280]">
                    {current ? ROLE_LABELS[current.role] : "Seleccionar perfil"}
                  </span>
                </span>
                <svg
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-hover:text-[#6b7280] ${isProfileMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
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