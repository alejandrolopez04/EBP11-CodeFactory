import { useState, type ReactNode } from "react";
import { useBusinessVariables } from "../business-variables/BusinessVariablesContext";
import Badge from "../business-variables/components/Badge";
import DemandForm from "../business-variables/forms/DemandForm";
import AvailabilityForm from "../business-variables/forms/AvailabilityForm";
import ScheduleForm from "../business-variables/forms/ScheduleForm";
import {
  availabilityDraftToValues,
  demandDraftToValues,
  scheduleDraftToValues,
  toAvailabilityDraft,
  toDemandDraft,
  toScheduleDraft,
  type AvailabilityDraftValues,
  type DemandDraftValues,
  type ScheduleDraftValues,
} from "../business-variables/types";
import {
  validateAvailabilityValues,
  validateDemandValues,
  validateScheduleValues,
} from "../business-variables/validators";

export default function BusinessVariablesScreen() {
  const { variables, save } = useBusinessVariables();

  const [demandEdit, setDemandEdit] = useState(false);
  const [availEdit, setAvailEdit] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState(false);

  const [draftDemandValues, setDraftDemandValues] = useState<DemandDraftValues>({
    lowMax: "",
    mediumMax: "",
    highFrom: "",
  });

  const [draftAvailabilityValues, setDraftAvailabilityValues] = useState<AvailabilityDraftValues>({
    criticalThreshold: "",
    lowThreshold: "",
    normalFrom: "",
  });

  const [draftScheduleValues, setDraftScheduleValues] = useState<ScheduleDraftValues>({
    peakAmStart: "",
    peakAmEnd: "",
    peakPmStart: "",
    peakPmEnd: "",
  });

  const [draftHighSeasonMonths, setDraftHighSeasonMonths] = useState<string[]>([]);

  if (variables === null) {
    return null;
  }

  const demandErrors = validateDemandValues(draftDemandValues);
  const availabilityErrors = validateAvailabilityValues(draftAvailabilityValues);
  const scheduleErrors = validateScheduleValues(draftScheduleValues, draftHighSeasonMonths);

  const hasDemandErrors = Object.keys(demandErrors).length > 0;
  const hasAvailabilityErrors = Object.keys(availabilityErrors).length > 0;
  const hasScheduleErrors = Object.keys(scheduleErrors).length > 0;

  const handleEditDemand = () => {
    setDraftDemandValues(toDemandDraft(variables.demand));
    setDemandEdit(true);
  };

  const handleCancelDemand = () => {
    setDraftDemandValues(toDemandDraft(variables.demand));
    setDemandEdit(false);
  };

  const handleApplyDemand = () => {
    if (hasDemandErrors) return;

    save({
      ...variables,
      demand: demandDraftToValues(draftDemandValues),
    });

    setDemandEdit(false);
  };

  const handleEditAvailability = () => {
    setDraftAvailabilityValues(toAvailabilityDraft(variables.availability));
    setAvailEdit(true);
  };

  const handleCancelAvailability = () => {
    setDraftAvailabilityValues(toAvailabilityDraft(variables.availability));
    setAvailEdit(false);
  };

  const handleApplyAvailability = () => {
    if (hasAvailabilityErrors) return;

    save({
      ...variables,
      availability: availabilityDraftToValues(draftAvailabilityValues),
    });

    setAvailEdit(false);
  };

  const handleEditSchedule = () => {
    setDraftScheduleValues(toScheduleDraft(variables.schedule));
    setDraftHighSeasonMonths(variables.highSeasonMonths);
    setScheduleEdit(true);
  };

  const handleCancelSchedule = () => {
    setDraftScheduleValues(toScheduleDraft(variables.schedule));
    setDraftHighSeasonMonths(variables.highSeasonMonths);
    setScheduleEdit(false);
  };

  const handleApplySchedule = () => {
    if (hasScheduleErrors) return;

    save({
      ...variables,
      schedule: scheduleDraftToValues(draftScheduleValues),
      highSeasonMonths: draftHighSeasonMonths,
    });

    setScheduleEdit(false);
  };

  return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-1">Variables de Negocio</h1>
          <p className="text-[13px] text-[#6b7280]">Configura las variables que el motor utilizará para evaluar las reglas de pricing.</p>
        </div>

        <div className="space-y-4 max-w-3xl">
          <VariableCard
              icon={<DemandIcon />}
              title="Demanda"
              description="Define niveles de demanda y sus rangos numéricos de referencia."
              configured={variables !== null}
              editing={demandEdit}
              onEdit={handleEditDemand}
              onCancel={handleCancelDemand}
              onApply={handleApplyDemand}
              applyDisabled={hasDemandErrors}
              summary={
                <div className="flex gap-2">
                  <Badge label={`Baja: 0–${variables.demand.lowMax}%`} />
                  <Badge label={`Media: ${variables.demand.lowMax + 1 || 31}–${variables.demand.mediumMax}%`} />
                  <Badge label={`Alta: >${variables.demand.mediumMax}%`} />
                </div>
              }
              editContent={
                <DemandForm
                    values={draftDemandValues}
                    errors={demandErrors}
                    onChange={setDraftDemandValues}
                />
              }
          />

          <VariableCard
              icon={<AvailIcon />}
              title="Disponibilidad"
              description="Define umbrales de stock para activar reglas de pricing."
              configured={variables !== null}
              editing={availEdit}
              onEdit={handleEditAvailability}
              onCancel={handleCancelAvailability}
              onApply={handleApplyAvailability}
              applyDisabled={hasAvailabilityErrors}
              summary={
                <div className="flex gap-2">
                  <Badge label={`Crítico: <${variables.availability.criticalThreshold}%`}  />
                  <Badge label={`Bajo: ${variables.availability.criticalThreshold}–${variables.availability.lowThreshold}%`} />
                  <Badge label={`Normal: >${variables.availability.lowThreshold}%`} />
                </div>
              }
              editContent={
                <AvailabilityForm
                    values={draftAvailabilityValues}
                    errors={availabilityErrors}
                    onChange={setDraftAvailabilityValues}
                />
              }
          />

          <VariableCard
              icon={<ClockIcon />}
              title="Horario / Temporada"
              description="Define franjas horarias y temporadas que condicionan los precios."
              configured={variables !== null}
              editing={scheduleEdit}
              onEdit={handleEditSchedule}
              onCancel={handleCancelSchedule}
              onApply={handleApplySchedule}
              applyDisabled={hasScheduleErrors}
              summary={
                <div className="flex flex-wrap gap-2">
                  <Badge label={`Hora pico: ${variables.schedule.peakAmStart}–${variables.schedule.peakAmEnd}, ${variables.schedule.peakPmStart}–${variables.schedule.peakPmEnd}`} />
                  <Badge label="Fin de semana: Sáb–Dom" />
                  <Badge label={`Temporada alta: ${variables.highSeasonMonths.join(", ") || "sin meses"}`} />
                </div>
              }
              editContent={
                <ScheduleForm
                    values={draftScheduleValues}
                    highSeasonMonths={draftHighSeasonMonths}
                    errors={scheduleErrors}
                    onScheduleChange={setDraftScheduleValues}
                    onMonthsChange={setDraftHighSeasonMonths}
                />
              }
          />
        </div>

        <button
            onClick={() => {
              localStorage.removeItem("business-variables:v1");
              location.reload();
            }}
        >
          Reiniciar wizard
        </button>

      </div>

  );
}

function VariableCard({
                        icon,
                        title,
                        description,
                        configured,
                        editing,
                        onEdit,
                        onCancel,
                        onApply,
                        applyDisabled = false,
                        summary,
                        editContent,
                      }: {
  icon: ReactNode;
  title: string;
  description: string;
  configured: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onApply?: () => void;
  applyDisabled?: boolean;
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
                <button
                    onClick={onApply ?? onCancel}
                    disabled={applyDisabled}
                    className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                        applyDisabled
                            ? "bg-[#9ca3af] text-white cursor-not-allowed"
                            : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
                    }`}
                >
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