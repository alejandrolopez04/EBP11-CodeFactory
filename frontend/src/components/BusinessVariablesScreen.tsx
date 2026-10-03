type NumericFieldErrors = Record<string, string>;

import { useState, type ReactNode } from "react";
type ScheduleFieldErrors = Record<string, string>;

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const isPercentageValueValid = (value: string) => {
  if (value.trim() === "") return false;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100;
};

const isTimeRangeValid = (start: string, end: string) => {
  if (!start || !end) return false;
  return start < end;
};

export default function BusinessVariablesScreen() {
  const [demandEdit, setDemandEdit] = useState(false);
  const [availEdit, setAvailEdit] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  const [demandValues, setDemandValues] = useState({
    lowMax: "30",
    mediumMax: "70",
    highFrom: "71",
  });

  const [draftDemandValues, setDraftDemandValues] = useState(demandValues);

  const [availabilityValues, setAvailabilityValues] = useState({
    criticalThreshold: "10",
    lowThreshold: "40",
    normalFrom: "41",
  });

  const [draftAvailabilityValues, setDraftAvailabilityValues] = useState(availabilityValues);

  const [scheduleValues, setScheduleValues] = useState({
    peakAmStart: "08:00",
    peakAmEnd: "10:00",
    peakPmStart: "18:00",
    peakPmEnd: "20:00",
  });

  const [draftScheduleValues, setDraftScheduleValues] = useState(scheduleValues);

  const [highSeasonMonths, setHighSeasonMonths] = useState<string[]>([
    "Diciembre",
    "Enero",
    "Febrero",
  ]);

  const [draftHighSeasonMonths, setDraftHighSeasonMonths] = useState<string[]>(highSeasonMonths);
  const [monthToAdd, setMonthToAdd] = useState("");

  const validateDemandValues = () => {
    const errors: NumericFieldErrors = {};

    Object.entries(draftDemandValues).forEach(([key, value]) => {
      if (!isPercentageValueValid(value)) {
        errors[key] = "Debe ser un número entre 0 y 100.";
      }
    });

    const lowMax = Number(draftDemandValues.lowMax);
    const mediumMax = Number(draftDemandValues.mediumMax);
    const highFrom = Number(draftDemandValues.highFrom);

    if (
        Object.keys(errors).length === 0 &&
        !(lowMax < mediumMax && mediumMax < highFrom)
    ) {
      errors.lowMax = "Los rangos deben ser ascendentes.";
      errors.mediumMax = "Los rangos deben ser ascendentes.";
      errors.highFrom = "Los rangos deben ser ascendentes.";
    }

    return errors;
  };

  const validateAvailabilityValues = () => {
    const errors: NumericFieldErrors = {};

    Object.entries(draftAvailabilityValues).forEach(([key, value]) => {
      if (!isPercentageValueValid(value)) {
        errors[key] = "Debe ser un número entre 0 y 100.";
      }
    });

    const criticalThreshold = Number(draftAvailabilityValues.criticalThreshold);
    const lowThreshold = Number(draftAvailabilityValues.lowThreshold);
    const normalFrom = Number(draftAvailabilityValues.normalFrom);

    if (
        Object.keys(errors).length === 0 &&
        !(criticalThreshold < lowThreshold && lowThreshold < normalFrom)
    ) {
      errors.criticalThreshold = "Los umbrales deben ser ascendentes.";
      errors.lowThreshold = "Los umbrales deben ser ascendentes.";
      errors.normalFrom = "Los umbrales deben ser ascendentes.";
    }

    return errors;
  };

  const validateScheduleValues = () => {
    const errors: ScheduleFieldErrors = {};

    if (!isTimeRangeValid(draftScheduleValues.peakAmStart, draftScheduleValues.peakAmEnd)) {
      errors.peakAm = "La hora de término AM debe ser mayor que la hora de inicio.";
    }

    if (!isTimeRangeValid(draftScheduleValues.peakPmStart, draftScheduleValues.peakPmEnd)) {
      errors.peakPm = "La hora de término PM debe ser mayor que la hora de inicio.";
    }

    if (draftHighSeasonMonths.length === 0) {
      errors.highSeasonMonths = "Selecciona al menos un mes para temporada alta.";
    }

    return errors;
  };

  const demandErrors = validateDemandValues();
  const availabilityErrors = validateAvailabilityValues();
  const scheduleErrors = validateScheduleValues();

  const hasDemandErrors = Object.keys(demandErrors).length > 0;
  const hasAvailabilityErrors = Object.keys(availabilityErrors).length > 0;
  const hasScheduleErrors = Object.keys(scheduleErrors).length > 0;
  const hasOpenEdition = demandEdit || availEdit || scheduleEdit;

  const availableMonthsToAdd = MONTHS.filter((month) => !draftHighSeasonMonths.includes(month));

  const handleEditDemand = () => {
    setDraftDemandValues(demandValues);
    setDemandEdit(true);
  };

  const handleCancelDemand = () => {
    setDraftDemandValues(demandValues);
    setDemandEdit(false);
  };

  const handleApplyDemand = () => {
    if (hasDemandErrors) return;

    setDemandValues(draftDemandValues);
    setDemandEdit(false);
  };

  const handleEditAvailability = () => {
    setDraftAvailabilityValues(availabilityValues);
    setAvailEdit(true);
  };

  const handleCancelAvailability = () => {
    setDraftAvailabilityValues(availabilityValues);
    setAvailEdit(false);
  };

  const handleApplyAvailability = () => {
    if (hasAvailabilityErrors) return;

    setAvailabilityValues(draftAvailabilityValues);
    setAvailEdit(false);
  };

  const handleEditSchedule = () => {
    setDraftScheduleValues(scheduleValues);
    setDraftHighSeasonMonths(highSeasonMonths);
    setMonthToAdd("");
    setScheduleEdit(true);
  };

  const handleCancelSchedule = () => {
    setDraftScheduleValues(scheduleValues);
    setDraftHighSeasonMonths(highSeasonMonths);
    setMonthToAdd("");
    setScheduleEdit(false);
  };

  const handleApplySchedule = () => {
    if (hasScheduleErrors) return;

    setScheduleValues(draftScheduleValues);
    setHighSeasonMonths(draftHighSeasonMonths);
    setMonthToAdd("");
    setScheduleEdit(false);
  };

  const handleAddHighSeasonMonth = () => {
    if (!monthToAdd) return;

    setDraftHighSeasonMonths((current) => [...current, monthToAdd]);
    setMonthToAdd("");
  };

  const handleRemoveHighSeasonMonth = (month: string) => {
    setDraftHighSeasonMonths((current) => current.filter((item) => item !== month));
  };

  const handleSave = () => {
    if (hasOpenEdition || hasDemandErrors || hasAvailabilityErrors || hasScheduleErrors) return;

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
              onEdit={handleEditDemand}
              onCancel={handleCancelDemand}
              onApply={handleApplyDemand}
              applyDisabled={hasDemandErrors}
              summary={
                <div className="flex gap-2">
                  <Badge label={`Baja: 0–${demandValues.lowMax}%`} />
                  <Badge label={`Media: ${Number(demandValues.lowMax) + 1 || 31}–${demandValues.mediumMax}%`} />
                  <Badge label={`Alta: >${demandValues.mediumMax}%`} />
                </div>
              }
              editContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <LevelField
                        label="Baja — rango máx."
                        value={draftDemandValues.lowMax}
                        suffix="%"
                        error={Boolean(demandErrors.lowMax)}
                        errorMessage={demandErrors.lowMax}
                        onChange={(value) => setDraftDemandValues((current) => ({ ...current, lowMax: value }))}
                    />
                    <LevelField
                        label="Media — rango máx."
                        value={draftDemandValues.mediumMax}
                        suffix="%"
                        error={Boolean(demandErrors.mediumMax)}
                        errorMessage={demandErrors.mediumMax}
                        onChange={(value) => setDraftDemandValues((current) => ({ ...current, mediumMax: value }))}
                    />
                    <LevelField
                        label="Alta — desde"
                        value={draftDemandValues.highFrom}
                        suffix="%"
                        error={Boolean(demandErrors.highFrom)}
                        errorMessage={demandErrors.highFrom}
                        onChange={(value) => setDraftDemandValues((current) => ({ ...current, highFrom: value }))}
                    />
                  </div>
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
              onEdit={handleEditAvailability}
              onCancel={handleCancelAvailability}
              onApply={handleApplyAvailability}
              applyDisabled={hasAvailabilityErrors}
              summary={
                <div className="flex gap-2">
                  <Badge label={`Crítico: <${availabilityValues.criticalThreshold}%`} />
                  <Badge label={`Bajo: ${availabilityValues.criticalThreshold}–${availabilityValues.lowThreshold}%`} />
                  <Badge label={`Normal: >${availabilityValues.lowThreshold}%`} />
                </div>
              }
              editContent={
                <div className="grid grid-cols-3 gap-3">
                  <LevelField
                      label="Umbral crítico"
                      value={draftAvailabilityValues.criticalThreshold}
                      suffix="%"
                      error={Boolean(availabilityErrors.criticalThreshold)}
                      errorMessage={availabilityErrors.criticalThreshold}
                      onChange={(value) => setDraftAvailabilityValues((current) => ({ ...current, criticalThreshold: value }))}
                  />
                  <LevelField
                      label="Umbral bajo"
                      value={draftAvailabilityValues.lowThreshold}
                      suffix="%"
                      error={Boolean(availabilityErrors.lowThreshold)}
                      errorMessage={availabilityErrors.lowThreshold}
                      onChange={(value) => setDraftAvailabilityValues((current) => ({ ...current, lowThreshold: value }))}
                  />
                  <LevelField
                      label="Normal desde"
                      value={draftAvailabilityValues.normalFrom}
                      suffix="%"
                      error={Boolean(availabilityErrors.normalFrom)}
                      errorMessage={availabilityErrors.normalFrom}
                      onChange={(value) => setDraftAvailabilityValues((current) => ({ ...current, normalFrom: value }))}
                  />
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
              onEdit={handleEditSchedule}
              onCancel={handleCancelSchedule}
              onApply={handleApplySchedule}
              applyDisabled={hasScheduleErrors}
              summary={
                <div className="flex flex-wrap gap-2">
                  <Badge label={`Hora pico: ${scheduleValues.peakAmStart}–${scheduleValues.peakAmEnd}, ${scheduleValues.peakPmStart}–${scheduleValues.peakPmEnd}`} />
                  <Badge label="Fin de semana: Sáb–Dom" />
                  <Badge label={`Temporada alta: ${highSeasonMonths.join(", ") || "sin meses"}`} />
                </div>
              }
              editContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TimeRangeField
                        label="Hora pico AM"
                        startValue={draftScheduleValues.peakAmStart}
                        endValue={draftScheduleValues.peakAmEnd}
                        errorMessage={scheduleErrors.peakAm}
                        onStartChange={(value) => setDraftScheduleValues((current) => ({ ...current, peakAmStart: value }))}
                        onEndChange={(value) => setDraftScheduleValues((current) => ({ ...current, peakAmEnd: value }))}
                    />

                    <TimeRangeField
                        label="Hora pico PM"
                        startValue={draftScheduleValues.peakPmStart}
                        endValue={draftScheduleValues.peakPmEnd}
                        errorMessage={scheduleErrors.peakPm}
                        onStartChange={(value) => setDraftScheduleValues((current) => ({ ...current, peakPmStart: value }))}
                        onEndChange={(value) => setDraftScheduleValues((current) => ({ ...current, peakPmEnd: value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Temporada alta (meses)</label>

                    <div className="flex gap-2">
                      <select
                          value={monthToAdd}
                          onChange={(event) => setMonthToAdd(event.target.value)}
                          className={`flex-1 px-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                              scheduleErrors.highSeasonMonths
                                  ? "border-[#dc2626] focus:ring-[#dc2626]/20"
                                  : "border-[#e2e6ed] focus:ring-[#1a56db]"
                          }`}
                      >
                        <option value="">Selecciona un mes...</option>
                        {availableMonthsToAdd.map((month) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                      </select>

                      <button
                          type="button"
                          onClick={handleAddHighSeasonMonth}
                          disabled={!monthToAdd}
                          className={`px-3 py-2 text-[12px] font-semibold rounded-[6px] transition-colors ${
                              !monthToAdd
                                  ? "bg-[#9ca3af] text-white cursor-not-allowed"
                                  : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
                          }`}
                      >
                        Agregar
                      </button>
                    </div>

                    {scheduleErrors.highSeasonMonths && (
                        <p className="mt-1 text-[11px] text-[#dc2626]">{scheduleErrors.highSeasonMonths}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {draftHighSeasonMonths.map((month) => (
                          <span
                              key={month}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8ecf2] text-[#374151] text-[11px] font-medium rounded-full"
                          >
                      {month}
                            <button
                                type="button"
                                onClick={() => handleRemoveHighSeasonMonth(month)}
                                className="text-[#6b7280] hover:text-[#dc2626] transition-colors"
                                aria-label={`Quitar ${month}`}
                            >
                        ×
                      </button>
                    </span>
                      ))}
                    </div>
                  </div>
                </div>
              }
          />
        </div>

        <div className="mt-6 max-w-3xl flex justify-end">
          <button
              onClick={handleSave}
              disabled={
                  hasOpenEdition ||
                  hasDemandErrors ||
                  hasAvailabilityErrors ||
                  hasScheduleErrors
              }
              className={`px-5 py-2 text-[13px] font-semibold rounded-[6px] transition-all ${
                  hasOpenEdition ||
                  hasDemandErrors ||
                  hasAvailabilityErrors ||
                  hasScheduleErrors
                      ? "bg-[#9ca3af] text-white cursor-not-allowed"
                      : saved
                          ? "bg-[#16a34a] text-white"
                          : "bg-[#1a56db] text-white hover:bg-[#1648c0]"
              }`}
          >
            {saved ? "✓ Cambios guardados" : "Guardar cambios"}
          </button>
        </div>
      </div>
  );
}

function VariableCard({
                        icon, title, description, configured, editing, onEdit, onCancel, onApply, applyDisabled = false, summary, editContent,
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

function Badge({ label, color }: { label: string; color?: "red" | "amber" }) {
  const cls = color === "red"
    ? "bg-[#fef2f2] text-[#dc2626]"
    : color === "amber"
    ? "bg-amber-50 text-amber-700"
    : "bg-[#e8ecf2] text-[#374151]";
  return <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${cls}`}>{label}</span>;
}

function LevelField({
                      label,
                      value,
                      suffix,
                      error,
                      errorMessage,
                      onChange,
                    }: {
  label: string;
  value: string;
  suffix: string;
  error?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
}) {
  return (
      <div>
        <label className="block text-[11px] font-semibold text-[#374151] mb-1">{label}</label>
        <div className="relative">
          <input
              type="number"
              value={value}
              min="0"
              max="100"
              step="1"
              onChange={(event) => onChange(event.target.value)}
              className={`w-full pr-8 pl-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                  error ? "border-[#dc2626] focus:ring-[#dc2626]/20" : "border-[#e2e6ed] focus:ring-[#1a56db]"
              } text-[#0f1117]`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9ca3af]">{suffix}</span>
        </div>
        {error && errorMessage && (
            <p className="mt-1 text-[11px] text-[#dc2626]">{errorMessage}</p>
        )}
      </div>
  );
}

function TimeRangeField({
                          label,
                          startValue,
                          endValue,
                          errorMessage,
                          onStartChange,
                          onEndChange,
                        }: {
  label: string;
  startValue: string;
  endValue: string;
  errorMessage?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const hasError = Boolean(errorMessage);

  return (
      <div>
        <label className="block text-[11px] font-semibold text-[#374151] mb-1">{label}</label>
        <div className="flex gap-2 items-center">
          <input
              type="time"
              value={startValue}
              onChange={(event) => onStartChange(event.target.value)}
              className={`flex-1 px-2 py-1.5 text-[12px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                  hasError
                      ? "border-[#dc2626] focus:ring-[#dc2626]/20"
                      : "border-[#e2e6ed] focus:ring-[#1a56db]"
              }`}
          />
          <span className="text-[#9ca3af] text-[12px]">–</span>
          <input
              type="time"
              value={endValue}
              onChange={(event) => onEndChange(event.target.value)}
              className={`flex-1 px-2 py-1.5 text-[12px] border rounded-[6px] focus:outline-none focus:ring-2 ${
                  hasError
                      ? "border-[#dc2626] focus:ring-[#dc2626]/20"
                      : "border-[#e2e6ed] focus:ring-[#1a56db]"
              }`}
          />
        </div>
        {hasError && (
            <p className="mt-1 text-[11px] text-[#dc2626]">{errorMessage}</p>
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
