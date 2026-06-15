interface DashboardCardProps {
  label: string;
  value: string;
  delta: string;
}

export default function DashboardCard({ label, value, delta }: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10">
      <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-black text-white">{value}</p>
      <span className="mt-3 inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
        {delta}
      </span>
    </div>
  );
}
