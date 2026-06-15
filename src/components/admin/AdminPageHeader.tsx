interface AdminPageHeaderProps {
  title: string;
  description: string;
}

export default function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Admin Console</p>
          <h1 className="mt-4 text-4xl font-black text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
            Sync data
          </button>
          <button className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400">
            New ticket
          </button>
        </div>
      </div>
    </div>
  );
}
