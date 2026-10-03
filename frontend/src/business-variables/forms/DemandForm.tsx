import LevelField from "../components/LevelField";
import type { DemandDraftValues, NumericFieldErrors } from "../types";

export default function DemandForm({
  values,
  errors,
  onChange,
  autoFocus = false,
}: {
  values: DemandDraftValues;
  errors: NumericFieldErrors;
  onChange: (values: DemandDraftValues) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <LevelField
          label="Baja — rango máx."
          value={values.lowMax}
          suffix="%"
          error={Boolean(errors.lowMax)}
          errorMessage={errors.lowMax}
          autoFocus={autoFocus}
          onChange={(value) => onChange({ ...values, lowMax: value })}
        />
        <LevelField
          label="Media — rango máx."
          value={values.mediumMax}
          suffix="%"
          error={Boolean(errors.mediumMax)}
          errorMessage={errors.mediumMax}
          onChange={(value) => onChange({ ...values, mediumMax: value })}
        />
        <LevelField
          label="Alta — desde"
          value={values.highFrom}
          suffix="%"
          error={Boolean(errors.highFrom)}
          errorMessage={errors.highFrom}
          onChange={(value) => onChange({ ...values, highFrom: value })}
        />
      </div>
    </div>
  );
}
