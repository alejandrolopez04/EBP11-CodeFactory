import { useState } from "react";
import TimeRangeField from "../components/TimeRangeField";
import { MONTHS, type ScheduleDraftValues, type ScheduleFieldErrors } from "../types";

export default function ScheduleForm({
  values,
  highSeasonMonths,
  errors,
  onScheduleChange,
  onMonthsChange,
  autoFocus = false,
}: {
  values: ScheduleDraftValues;
  highSeasonMonths: string[];
  errors: ScheduleFieldErrors;
  onScheduleChange: (values: ScheduleDraftValues) => void;
  onMonthsChange: (months: string[]) => void;
  autoFocus?: boolean;
}) {
  const [monthToAdd, setMonthToAdd] = useState("");

  const availableMonthsToAdd = MONTHS.filter((month) => !highSeasonMonths.includes(month));

  const handleAddHighSeasonMonth = () => {
    if (!monthToAdd) return;

    onMonthsChange([...highSeasonMonths, monthToAdd]);
    setMonthToAdd("");
  };

  const handleRemoveHighSeasonMonth = (month: string) => {
    onMonthsChange(highSeasonMonths.filter((item) => item !== month));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TimeRangeField
          label="Hora pico AM"
          startValue={values.peakAmStart}
          endValue={values.peakAmEnd}
          errorMessage={errors.peakAm}
          autoFocus={autoFocus}
          onStartChange={(value) => onScheduleChange({ ...values, peakAmStart: value })}
          onEndChange={(value) => onScheduleChange({ ...values, peakAmEnd: value })}
        />

        <TimeRangeField
          label="Hora pico PM"
          startValue={values.peakPmStart}
          endValue={values.peakPmEnd}
          errorMessage={errors.peakPm}
          onStartChange={(value) => onScheduleChange({ ...values, peakPmStart: value })}
          onEndChange={(value) => onScheduleChange({ ...values, peakPmEnd: value })}
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#374151] mb-1">Temporada alta (meses)</label>

        <div className="flex gap-2">
          <select
            value={monthToAdd}
            onChange={(event) => setMonthToAdd(event.target.value)}
            className={`flex-1 px-3 py-2 text-[13px] border rounded-[6px] focus:outline-none focus:ring-2 ${
              errors.highSeasonMonths
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

        {errors.highSeasonMonths && (
          <p className="mt-1 text-[11px] text-[#dc2626]">{errors.highSeasonMonths}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {highSeasonMonths.map((month) => (
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
  );
}
