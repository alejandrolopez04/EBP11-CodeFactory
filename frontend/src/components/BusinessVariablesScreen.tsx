import { useState, type ReactNode } from "react";

export default function BusinessVariablesScreen() {
  const [demandEdit, setDemandEdit] = useState(false);
  const [availEdit, setAvailEdit] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState(false);
  const [demandError, setDemandError] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-1">Variables de Negocio</h1>
        <p className="text-[13px] text-[#6b7280]">Configura las variables que el motor utilizará para evaluar las reglas de pricing.</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {/* Demanda */}
        <VariableCard
          icon={<DemandIcon />}
          title="Demanda"
          description="Define niveles de demanda y sus rangos numéricos de referencia."
          configured
          editing={demandEdit}
          onEdit={() => setDemandEdit(true)}
          onCancel={() => { setDemandEdit(false); setDemandError(false); }}
          summary={
            <div className="flex gap-2">
              <Badge label="Baja: 0–30%" />
              <Badge label="Media: 31–70%" />
              <Badge label="Alta: >70%" />
            </div>
          }
          editContent={
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <LevelField label="Baja — rango máx." value="30" suffix="%" error={demandError} onChange={() => {}} />
                <LevelField label="Media — rango máx." value="70" suffix="%" onChange={() => {}} />
                <LevelField label="Alta — desde" value="71" suffix="%" onChange={() => {}} />
              </div>
              {demandError && (
                <p className="text-[11px] text-[#dc2626]">El valor ingresado no es válido para esta variable.</p>
              )}
              <button
                onClick={() => setDemandError(!demandError)}
                className="text-[11px] text-[#6b7280] underline"
              >
                {demandError ? "Limpiar error" : "Simular error de validación"}
              </button>
            </div>
          }
        />

        {/* Disponibilidad */}
        <VariableCard
          icon={<AvailIcon />}
          title="Disponibilidad"
          description="Define umbrales de stock para activar reglas de pricing."
          configured
          editing={availEdit}
          onEdit={() => setAvailEdit(true)}
          onCancel={() => setAvailEdit(false)}
          summary={
            <div className="flex gap-2">
              <Badge label="Crítico: <10%" color="red" />
              <Badge label="Bajo: 10–40%" color="amber" />
              <Badge label="Normal: >40%" />
            </div>
          }
          editContent={
            <div className="grid grid-cols-3 gap-3">
              <LevelField label="Umbral crítico" value="10" suffix="%" onChange={() => {}} />
              <LevelField label="Umbral bajo" value="40" suffix="%" onChange={() => {}} />
              <LevelField label="Normal desde" value="41" suffix="%" onChange={() => {}} />
            </div>
          }
        />

        {/* Horario */}
        <VariableCard
          icon={<ClockIcon />}
          title="Horario / Temporada"
          description="Define franjas horarias y temporadas que condicionan los precios."
          configured
          editing={scheduleEdit}
          onEdit={() => setScheduleEdit(true)}
          onCancel={() => setScheduleEdit(false)}
          summary={
            <div className="flex flex-wrap gap-2">
              <Badge label="Hora pico: 8–10h, 18–20h" />
              <Badge label="Fin de semana: Sáb–Dom" />
              <Badge label="Temporada alta: Dic–Feb" />
            </div>
          }
          editContent={
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">Hora pico AM</label>
                  <div className="flex gap-2 items-center">
                    <input type="time" defaultValue="08:00" className="flex-1 px-2 py-1.5 text-[12px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                    <span className="text-[#9ca3af] text-[12px]">–</span>
                    <input type="time" defaultValue="10:00" className="flex-1 px-2 py-1.5 text-[12px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">Hora pico PM</label>
                  <div className="flex gap-2 items-center">
                    <input type="time" defaultValue="18:00" className="flex-1 px-2 py-1.5 text-[12px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                    <span className="text-[#9ca3af] text-[12px]">–</span>
                    <input type="time" defaultValue="20:00" className="flex-1 px-2 py-1.5 text-[12px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1">Temporada alta (meses)</label>
                <input type="text" defaultValue="Diciembre, Enero, Febrero" className="w-full px-3 py-2 text-[13px] border border-[#e2e6ed] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
            </div>
          }
        />
      </div>

      <div className="mt-6 max-w-3xl flex justify-end">
        <button
          onClick={handleSave}
          className={`px-5 py-2 text-[13px] font-semibold rounded-[6px] transition-all ${
            saved ? "bg-[#16a34a] text-white" : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
          }`}
        >
          {saved ? "✓ Cambios guardados" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function VariableCard({
  icon, title, description, configured, editing, onEdit, onCancel, summary, editContent,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  configured: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  summary: ReactNode;
  editContent: ReactNode;
}) {
  return (
    <div className={`bg-white border rounded-[8px] p-5 transition-all ${editing ? "border-[#1a56db] shadow-sm" : "border-[#e2e6ed]"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#e8f0fd] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-[#0f1117] font-display">{title}</h3>
              {configured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#dcfce7] text-[#16a34a] text-[10px] font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full" />
                  Configurada
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#6b7280] mt-0.5">{description}</p>
          </div>
        </div>
        {!editing && (
          <button onClick={onEdit} className="px-3 py-1.5 text-[12px] font-semibold text-[#1a56db] border border-[#1a56db]/30 rounded-[6px] hover:bg-[#e8f0fd] transition-colors">
            Editar
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <div className="pt-3 border-t border-[#f1f3f7]">
            {editContent}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#f1f3f7]">
            <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-semibold text-[#374151] border border-[#e2e6ed] rounded-[6px] hover:bg-[#f1f3f7] transition-colors">
              Cancelar
            </button>
            <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-semibold bg-[#1a56db] text-white rounded-[6px] hover:bg-[#1648c0] transition-colors">
              Aplicar
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-[#f1f3f7]">{summary}</div>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color?: "red" | "amber" }) {
  const cls = color === "red"
    ? "bg-[#fef2f2] text-[#dc2626]"
    : color === "amber"
    ? "bg-amber-50 text-amber-700"
    : "bg-[#e8ecf2] text-[#374151]";
  return <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${cls}`}>{label}</span>;
}

function LevelField({ label, value, suffix, error, onChange }: { label: string; value: string; suffix: string; error?: boolean; onChange: () => void }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#374151] mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          defaultValue={value}
          onChange={onChange}
          className={`w-full pr-8 pl-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
            error ? "border-[#dc2626] focus:ring-[#dc2626]/20" : "border-[#e2e6ed] focus:ring-[#1a56db]"
          } text-[#0f1117]`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9ca3af]">{suffix}</span>
      </div>
    </div>
  );
}

function DemandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 14l4-4 3 2 4-6 3 2" />
    </svg>
  );
}

function AvailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="14" height="12" rx="1.5" />
      <path d="M6 9h6M6 12h4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2" />
    </svg>
  );
}
