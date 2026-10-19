import { useCallback, useEffect, useState } from "react";
import ProductFormModal, { type ApiProduct } from "./ProductFormModal";
import Toast from "./Toast"
import { API_URL } from "../api/client";
import { apiFetch } from "../api/http";
import RestrictedButton from "../auth/RestrictedButton";


const PRODUCTS_API_URL = `${API_URL}/api/products`;

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function ProductsScreen({ onViewDetail }: { onViewDetail: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // HU02: los productos se cargan desde el backend
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Producto que se está editando (null = modal de edición cerrado)
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);

  // Producto pendiente por confirmar eliminación
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await apiFetch(PRODUCTS_API_URL);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
      setLoadError(null);
    } catch {
      setLoadError("No se pudieron cargar los productos. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = ["Todas", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter(
      (p) =>
          (category === "Todas" || p.category === category) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const showEmpty = !loading && !loadError && products.length === 0;

  // Función que elimina definitivamente
  const confirmDelete = () => {
    if (!productToDelete) return;
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    setToast(`Producto "${productToDelete.name}" eliminado`);
    setProductToDelete(null);
  };

  return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0f1117] font-display">Productos</h1>
          <div className="flex items-center gap-3">
            <RestrictedButton
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors flex items-center gap-2"
            >
              <span>+</span> Registrar producto
            </RestrictedButton>
          </div>
        </div>

        {showEmpty ? (
            <EmptyState onAdd={() => setShowModal(true)} />
        ) : (
            <>
              {loadError && (
                  <div className="mb-4 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-[12px] text-[#dc2626]">
                    {loadError}
                  </div>
              )}

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
              <div className="bg-white border border-[#e2e6ed] rounded-[8px] overflow-x-auto">
                <table className="w-full text-[13px] table-fixed min-w-[1200px]">
                  <thead>
                  <tr className="border-b border-[#e2e6ed] bg-[#f8f9fb]">
                    <th className="w-[9%] text-left px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">SKU</th>
                    <th className="w-[18%] text-left px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Nombre</th>
                    <th className="w-[11%] text-left px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Categoría</th>
                    <th className="w-[7%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Stock</th>
                    <th className="w-[8%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Demanda</th>
                    <th className="w-[10%] text-right px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Precio base</th>
                    <th className="w-[9%] text-right px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Mínimo</th>
                    <th className="w-[9%] text-right px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Máximo</th>
                    <th className="w-[9%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Estado</th>
                    <th className="w-[10%] text-center px-3 py-3 font-semibold text-[#6b7280] uppercase text-[11px] tracking-wide">Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.map((p, i) => (
                      <tr key={p.id} className={`border-b border-[#f1f3f7] hover:bg-[#f8f9fb] transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                        <td className="px-3 py-3 font-mono text-[12px] text-[#6b7280] truncate" title={p.sku}>{p.sku}</td>
                        <td className="px-3 py-3 font-medium text-[#0f1117] whitespace-nowrap truncate" title={p.name}>{p.name}</td>
                        <td className="px-3 py-3 text-[#6b7280] truncate" title={p.category}>{p.category}</td>
                        <td className="px-3 py-3 text-center text-[12px] font-medium text-[#0f1117] tabular-nums">{p.productAvailability}%</td>
                        <td className="px-3 py-3 text-center text-[12px] font-medium text-[#0f1117] tabular-nums">{p.productDemand}%</td>
                        <td className="px-3 py-3 text-right font-medium text-[#0f1117] whitespace-nowrap">{fmt(p.basePrice)}</td>
                        <td className="px-3 py-3 text-right text-[#6b7280] whitespace-nowrap">{fmt(p.minPrice)}</td>
                        <td className="px-3 py-3 text-right text-[#6b7280] whitespace-nowrap">{fmt(p.maxPrice)}</td>
                        <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                          p.productStatus === "ACTIVE" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f1f3f7] text-[#9ca3af]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.productStatus === "ACTIVE" ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
                        {p.productStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                      </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <RestrictedButton onClick={onViewDetail} className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors" title="Ver detalle">
                              <EyeIcon />
                            </RestrictedButton>
                            <RestrictedButton
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#e8ecf2] hover:text-[#1a56db] transition-colors"
                                title="Editar"
                            >
                              <EditIcon />
                            </RestrictedButton>
                            <RestrictedButton
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 rounded-[4px] text-[#6b7280] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors"
                                title="Eliminar"
                            >
                              <TrashIcon />
                            </RestrictedButton>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="px-4 py-3 border-t border-[#e2e6ed] flex items-center justify-between">
                  <span className="text-[12px] text-[#6b7280]">Mostrando {filtered.length} de {products.length} productos</span>
                  <div className="flex items-center gap-1">
                    <RestrictedButton className="px-2.5 py-1 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[4px] hover:bg-[#f1f3f7] disabled:opacity-40" disabled>
                      ← Anterior
                    </RestrictedButton>
                    <RestrictedButton className="px-2.5 py-1 text-[12px] font-semibold bg-[#1a56db] text-white rounded-[4px]">1</RestrictedButton>
                    <RestrictedButton className="px-2.5 py-1 text-[12px] font-medium text-[#6b7280] border border-[#e2e6ed] rounded-[4px] hover:bg-[#f1f3f7]">
                      Siguiente →
                    </RestrictedButton>
                  </div>
                </div>
              </div>
            </>
        )}
        {showModal && (
            <ProductFormModal
                onClose={() => setShowModal(false)}
                onProductCreated={() => {
                  setToast("Producto registrado exitosamente");
                  loadProducts();
                }}
            />
        )}

        {/* HU02: MODAL DE EDICIÓN */}
        {editingProduct && (
            <ProductFormModal
                product={editingProduct}
                onClose={() => setEditingProduct(null)}
                onProductUpdated={() => {
                  setToast("Producto actualizado exitosamente");
                  loadProducts();
                }}
            />
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {productToDelete && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[10px] border border-[#e2e6ed] w-full max-w-sm shadow-xl">

                {/* Header: ícono + título */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e2e6ed]">
                  <div className="w-9 h-9 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h12M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4M6 7v5M10 7v5M3 4l1 10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-10" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#0f1117] font-display">
                    Eliminar producto
                  </h3>
                </div>

                {/* Body */}
                <div className="px-8 py-5">
                  <p className="text-[13px] text-[#374151] mb-3">
                    ¿Estás seguro que deseas eliminar este producto?<br />
                    <span className="text-[13px] font-semibold text-[#0f1117] flex items-center justify-center break-all">Esta acción no se puede deshacer.</span>
                  </p>
                  <div className="flex items-baseline gap-1.5 px-3 py-2 bg-[#f8f9fb] border border-[#e2e6ed] rounded-[6px]">
                    <span className="text-[12px] text-[#6b7280] shrink-0">Producto:</span>
                    <span className="text-[13px] font-semibold text-[#0f1117] break-all">{productToDelete.name}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#e2e6ed] flex items-center justify-end gap-3">
                  <RestrictedButton
                      onClick={() => setProductToDelete(null)}
                      className="px-4 py-2 text-[13px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors"
                  >
                    Cancelar
                  </RestrictedButton>
                  <RestrictedButton
                      onClick={confirmDelete}
                      className="px-4 py-2 text-[13px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors"
                  >
                    Aceptar
                  </RestrictedButton>
                </div>
              </div>
            </div>
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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
        <RestrictedButton
            onClick={onAdd}
            className="px-4 py-2 bg-[#1a56db] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#1648c0] transition-colors flex items-center gap-2"
        >
          <span>+</span> Registrar producto
        </RestrictedButton>
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

function TrashIcon() {
  return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4M6 7v5M10 7v5M3 4l1 10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-10" />
      </svg>
  );
}