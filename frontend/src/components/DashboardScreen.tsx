export default function DashboardScreen() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0f1117] font-display mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Productos activos", value: "24", sub: "+3 este mes" },
          { label: "Reglas activas", value: "9", sub: "2 pausadas" },
          { label: "Ajustes de precio hoy", value: "147", sub: "Automáticos" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[8px] border border-[#e2e6ed] p-5">
            <div className="text-[13px] text-[#6b7280] mb-1">{s.label}</div>
            <div className="text-3xl font-bold text-[#0f1117] font-display">{s.value}</div>
            <div className="text-[12px] text-[#6b7280] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
