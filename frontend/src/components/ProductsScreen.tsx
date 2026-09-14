import { useState } from "react";
import ProductFormModal from "./ProductFormModal";

const PRODUCTS = [
  { sku: "SUB-PRE-001", name: "Suscripción Premium Mensual", category: "Suscripciones", base: 29900, min: 24900, max: 39900, status: "Activo" },
  { sku: "SUB-BAS-002", name: "Suscripción Básica Mensual", category: "Suscripciones", base: 9900, min: 7900, max: 14900, status: "Activo" },
  { sku: "ENV-EXP-003", name: "Envío Express 24h", category: "Envíos", base: 5900, min: 4900, max: 8900, status: "Activo" },
  { sku: "ENV-STD-004", name: "Envío Estándar 5 días", category: "Envíos", base: 2900, min: 1900, max: 4500, status: "Activo" },
  { sku: "ENT-VIP-005", name: "Entrada VIP Evento Anual", category: "Entradas", base: 150000, min: 120000, max: 220000, status: "Activo" },
  { sku: "ENT-GEN-006", name: "Entrada General Evento", category: "Entradas", base: 45000, min: 35000, max: 65000, status: "Inactivo" },
  { sku: "ALC-CORP-007", name: "Almacenamiento Corporativo 1TB", category: "Almacenamiento", base: 19900, min: 14900, max: 29900, status: "Activo" },
  { sku: "SOP-PRE-008", name: "Soporte Prioritario 24/7", category: "Soporte", base: 49900, min: 39900, max: 69900, status: "Inactivo" },
];

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function ProductsScreen({ onViewDetail }: { onViewDetail: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const categories = ["Todas", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
  const filtered = PRODUCTS.filter(
    (p) =>
      (category === "Todas" || p.category === category) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display">Productos</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmpty(!showEmpty)}
            className="px-3 py-2 text-[13px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors"
          >
            {showEmpty ? "Ver tabla" : "Ver estado vacío"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors flex items-center gap-2"
          >
            <span>+</span> Registrar producto
          </button>
        </div>
      </div>

      {showEmpty ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11l3 3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por SKU o nombre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] placeholder-[#9ca3af] text-[#0f1117] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-[13px] bg-white border border-[#e2e6ed] rounded-[6px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Precio base</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Mínimo</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Máximo</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.sku} className={`border-b border-[#f1f3f7] hover:bg-[#f8f9fb] transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#6b7280]">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-[#0f1117]">{p.name}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{p.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0f1117]">{fmt(p.base)}</td>
                    <td className="px-4 py-3 text-right text-[#6b7280]">{fmt(p.min)}</td>
                    <td className="px-4 py-3 text-right text-[#6b7280]">{fmt(p.max)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        p.status === "Activo" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f1f3f7] text-[#9ca3af]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Activo" ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={onViewDetail} className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors" title="Ver detalle">
                          <EyeIcon />
                        </button>
                        <button className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors" title="Editar">
                          <EditIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-[#e2e6ed] flex items-center justify-between">
              <span className="text-[12px] text-[#6b7280]">Mostrando {filtered.length} de {PRODUCTS.length} productos</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[4px] hover:bg-[#f1f3f7] disabled:opacity-40" disabled>
                  ← Anterior
                </button>
                <button className="px-2.5 py-1 text-[12px] font-semibold bg-[#1a56db] text-white rounded-[4px]">1</button>
                <button className="px-2.5 py-1 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[4px] hover:bg-[#f1f3f7]">
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && <ProductFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e8ecf2] flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-[#0f1117] font-display mb-1">Aún no has registrado productos</h3>
      <p className="text-[13px] text-[#6b7280] mb-5 max-w-xs">Registra tu primer producto para comenzar a configurar reglas de pricing dinámico.</p>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors flex items-center gap-2"
      >
        <span>+</span> Registrar producto
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}
