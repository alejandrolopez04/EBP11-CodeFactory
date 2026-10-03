export default function LevelField({
  label,
  value,
  suffix,
  error,
  errorMessage,
  onChange,
  autoFocus = false,
}: {
  label: string;
  value: string;
  suffix: string;
  error?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
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
          autoFocus={autoFocus}
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
