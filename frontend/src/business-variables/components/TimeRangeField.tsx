export default function TimeRangeField({
  label,
  startValue,
  endValue,
  errorMessage,
  onStartChange,
  onEndChange,
  autoFocus = false,
}: {
  label: string;
  startValue: string;
  endValue: string;
  errorMessage?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const hasError = Boolean(errorMessage);

  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#374151] mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="time"
          value={startValue}
          autoFocus={autoFocus}
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
