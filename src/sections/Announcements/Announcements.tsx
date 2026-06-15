import { prisma } from "@/lib/db";

const TYPE_BADGE: Record<string, string> = {
  champion: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rank_up:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  general:  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  champion: "🏆 Champion",
  rank_up:  "⬆ Rank Up",
  general:  "📢 Update",
};

export default async function Announcements() {
  const now = new Date();

  const rows = await prisma.announcement.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (rows.length === 0) {
    return (
      <section className="section-padding bg-slate-950/70">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Announcements</p>
          <h2 className="mt-3 text-4xl font-black text-white">Live updates for the lounge</h2>
          <p className="mt-4 text-slate-400">No announcements right now. Check back later for event news and special offers.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-slate-950/70">
      <div className="max-w-7xl mx-auto rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Announcements</p>
        <h2 className="mt-3 text-4xl font-black text-white">Latest updates</h2>

        <div className="mt-8 space-y-4">
          {rows.map((a) => {
            const type = a.type ?? "general";
            return (
              <div key={a.id} className="rounded-3xl border border-white/5 bg-black/30 p-6">
                <div className="flex items-start gap-4 flex-wrap">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${TYPE_BADGE[type] ?? TYPE_BADGE.general}`}>
                    {TYPE_LABEL[type] ?? "📢 Update"}
                  </span>
                  {a.tournamentName && (
                    <span className="text-xs text-slate-400 pt-1">{a.tournamentName}</span>
                  )}
                </div>
                <p className="mt-3 text-slate-200 text-lg leading-relaxed">{a.message}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {a.expiresAt && (
                    <span>Active until {new Date(a.expiresAt).toLocaleDateString()}</span>
                  )}
                  {a.winnerName && (
                    <span className="text-yellow-400 font-semibold">Winner: {a.winnerName}</span>
                  )}
                  {a.prizeAmount && (
                    <span className="text-green-400">Prize: ${a.prizeAmount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
