import LevelField from "../components/LevelField";
import type { AvailabilityDraftValues, NumericFieldErrors } from "../types";

export default function AvailabilityForm({
  values,
  errors,
  onChange,
  autoFocus = false,
}: {
  values: AvailabilityDraftValues;
  errors: NumericFieldErrors;
  onChange: (values: AvailabilityDraftValues) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <LevelField
        label={<p className="text-[11px] text-[#6b7280] mt-1">Crítico desde 0 hasta {values.availabilityLow === "" || values.availabilityLow > 100 ? "-" : `${values.availabilityLow}`}%</p>}
        value={values.availabilityLow}
        suffix="%"
        error={Boolean(errors.availabilityLow)}
        errorMessage={errors.availabilityLow}
        autoFocus={autoFocus}
        onChange={(value) => onChange({ ...values, availabilityLow: value })}
      />
      <LevelField
        label={<p className="text-[11px] text-[#6b7280] mt-1">Normal desde {values.availabilityHigh === "" || (values.availabilityHigh > 100 || values.availabilityHigh == 0) ? "-" : `${values.availabilityHigh}`} hasta 100%</p>}
        value={values.availabilityHigh}
        suffix="%"
        error={Boolean(errors.availabilityHigh)}
        errorMessage={errors.availabilityHigh}
        onChange={(value) => onChange({ ...values, availabilityHigh: value })}
      />
    </div>
  );
}
