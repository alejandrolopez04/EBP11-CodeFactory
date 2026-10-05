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
          label={<p className="text-[11px] text-[#6b7280] mt-1">Bajo desde 0 hasta {values.demandLow === "" || values.demandLow > 100 ? "-" : `${values.demandLow}`}%</p>}
          value={values.demandLow}
          suffix="%"
          error={Boolean(errors.demandLow)}
          errorMessage={errors.demandLow}
          autoFocus={autoFocus}
          onChange={(value) => onChange({ ...values, demandLow: value })}
        />
        <LevelField
          label={<p className="text-[11px] text-[#6b7280] mt-1">Alto desde {values.demandHigh === "" || (values.demandHigh > 100 || values.demandHigh == 0) ? "-" : `${values.demandHigh}`} hasta 100%</p>}
          value={values.demandHigh}
          suffix="%"
          error={Boolean(errors.demandHigh)}
          errorMessage={errors.demandHigh}
          onChange={(value) => onChange({ ...values, demandHigh: value })}
        />
      </div>
    </div>
  );
}
