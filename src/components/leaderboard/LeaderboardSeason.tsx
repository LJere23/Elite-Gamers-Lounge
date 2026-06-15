export default function LeaderboardSeason() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">

      <div>

        <p className="uppercase tracking-[0.3em] text-cyan-400 text-sm mb-3">
          Current Competitive Season
        </p>

        <h2 className="text-4xl md:text-5xl font-black uppercase">
          Neon Rush
        </h2>

      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4">

        <p className="text-zinc-500 text-sm">
          Season Ends
        </p>

        <h3 className="text-2xl font-black mt-1">
          June 1st
        </h3>

      </div>

    </div>
  );
}