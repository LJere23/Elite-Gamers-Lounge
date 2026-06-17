import { prisma } from "./db";

export async function runWeeklyLeaderboard(): Promise<{ posted: boolean; topCount: number }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const entries = await prisma.xpLedger.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: {
      player: { select: { id: true, name: true, gamerTag: true } },
    },
  });

  // Aggregate XP per player
  const totals = new Map<string, { gamerTag: string; xp: number }>();
  for (const e of entries) {
    if (!e.player) continue;
    const existing = totals.get(e.playerId);
    if (existing) {
      existing.xp += e.amount;
    } else {
      totals.set(e.playerId, { gamerTag: e.player.gamerTag, xp: e.amount });
    }
  }

  const sorted = [...totals.values()].sort((a, b) => b.xp - a.xp).slice(0, 5);
  if (sorted.length === 0) return { posted: false, topCount: 0 };

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const lines  = sorted.map((p, i) => `${medals[i]} @${p.gamerTag} +${p.xp} XP`);

  const dateRange = `${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  await prisma.announcement.create({
    data: {
      type:     "weekly_leaderboard",
      message:  `📊 Weekly Top Adventurers (${dateRange}):\n${lines.join("  ")}`,
      expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  return { posted: true, topCount: sorted.length };
}
