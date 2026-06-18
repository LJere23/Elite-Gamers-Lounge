import { prisma } from "./db";

export function getWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum   = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function trackChallenge(
  playerId: string,
  type: string,
  amount = 1
): Promise<void> {
  try {
    const weekKey    = getWeekKey();
    const challenges = await prisma.challenge.findMany({
      where: { type, active: true, weeklyReset: true },
    });

    for (const challenge of challenges) {
      const existing = await prisma.playerChallengeProgress.upsert({
        where: { playerId_challengeId_weekKey: { playerId, challengeId: challenge.id, weekKey } },
        create: {
          playerId,
          challengeId: challenge.id,
          weekKey,
          progress:   Math.min(amount, challenge.target),
          completed:  amount >= challenge.target,
          completedAt: amount >= challenge.target ? new Date() : null,
          xpAwarded:  false,
        },
        update: {
          progress: { increment: amount },
        },
      });

      // If just crossed the target, mark completed and award XP
      if (!existing.completed && existing.progress + amount >= challenge.target) {
        await prisma.playerChallengeProgress.update({
          where: { id: existing.id },
          data: { completed: true, completedAt: new Date() },
        });

        if (!existing.xpAwarded) {
          await prisma.$transaction([
            prisma.xpLedger.create({
              data: {
                playerId,
                amount: challenge.xpReward,
                source: "challenge",
                note:   `Challenge: ${challenge.name}`,
              },
            }),
            prisma.player.update({
              where: { id: playerId },
              data:  { xp: { increment: challenge.xpReward } },
            }),
            prisma.playerChallengeProgress.update({
              where: { id: existing.id },
              data:  { xpAwarded: true },
            }),
          ]);

          await prisma.notification.create({
            data: {
              playerId,
              type:    "quest",
              heading: "Challenge Complete!",
              message: `You completed the weekly challenge "${challenge.name}" and earned ${challenge.xpReward} XP!`,
              severity: "success",
            },
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("[trackChallenge]", { playerId, type, amount }, err);
  }
}

export async function resetWeeklyChallenges(weekKey: string): Promise<void> {
  // Mark old week's progress as historical — nothing to delete; just don't carry over
  // Challenges for the new week will be created fresh via upsert
  console.log(`[challenges] Weekly reset for week ${weekKey} complete (new week auto-creates on next activity).`);
}
