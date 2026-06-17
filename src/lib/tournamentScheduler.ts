import { prisma } from "./db";

export async function runTournamentLifecycle(): Promise<{ started: number; completed: number }> {
  const now = new Date();
  let started = 0;
  let completed = 0;

  // scheduled → ongoing
  const toStart = await prisma.tournament.findMany({
    where: { status: "scheduled", startAt: { lte: now } },
  });

  for (const t of toStart) {
    await prisma.tournament.update({ where: { id: t.id }, data: { status: "ongoing" } });

    const circuitPart = t.circuit ? ` on ${t.circuit}` : "";
    await prisma.announcement.create({
      data: {
        tournamentId:   t.id,
        tournamentName: t.name,
        type:           "tournament_started",
        message:        `⚡ ${t.name} is LIVE NOW! ${t.game}${circuitPart} — head to the lounge and compete. +${t.xpReward} XP on entry.`,
        expiresAt:      t.endAt,
      },
    }).catch(() => {});

    started++;
  }

  // ongoing → completed (auto-close past-endAt tournaments with no winner set)
  const toComplete = await prisma.tournament.findMany({
    where: { status: "ongoing", endAt: { lte: now } },
  });

  for (const t of toComplete) {
    await prisma.tournament.update({
      where: { id: t.id },
      data: { status: "completed", completedAt: now },
    });

    const winnerLine = t.winnerName ? `🥇 Winner: ${t.winnerName}` : "Results pending — check with staff.";
    const prizeLine  = t.prizeDescription ? ` Prize: ${t.prizeDescription}.` : "";

    await prisma.announcement.create({
      data: {
        tournamentId:   t.id,
        tournamentName: t.name,
        type:           "champion",
        winnerName:     t.winnerName ?? undefined,
        prizeAmount:    t.prizeDescription || undefined,
        message:        `🏆 ${t.name} has wrapped up. ${winnerLine}${prizeLine} Thanks to all who competed!`,
        expiresAt:      new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => {});

    completed++;
  }

  return { started, completed };
}
