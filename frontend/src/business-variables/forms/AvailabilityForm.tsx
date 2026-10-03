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
        label="Umbral crítico"
        value={values.criticalThreshold}
        suffix="%"
        error={Boolean(errors.criticalThreshold)}
        errorMessage={errors.criticalThreshold}
        autoFocus={autoFocus}
        onChange={(value) => onChange({ ...values, criticalThreshold: value })}
      />
      <LevelField
        label="Umbral bajo"
        value={values.lowThreshold}
        suffix="%"
        error={Boolean(errors.lowThreshold)}
        errorMessage={errors.lowThreshold}
        onChange={(value) => onChange({ ...values, lowThreshold: value })}
      />
      <LevelField
        label="Normal desde"
        value={values.normalFrom}
        suffix="%"
        error={Boolean(errors.normalFrom)}
        errorMessage={errors.normalFrom}
        onChange={(value) => onChange({ ...values, normalFrom: value })}
      />
    </div>
  );
}
