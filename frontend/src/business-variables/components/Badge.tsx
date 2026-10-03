export default function Badge({ label, color }: { label: string; color?: "red" | "amber" }) {
  const cls = color === "red"
    ? "bg-[#fef2f2] text-[#dc2626]"
    : color === "amber"
    ? "bg-amber-50 text-amber-700"
    : "bg-[#e8ecf2] text-[#374151]";

  return <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${cls}`}>{label}</span>;
}
