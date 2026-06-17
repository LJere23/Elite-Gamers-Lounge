import { prisma } from "./db";
import { getTierRule } from "./membershipTiers";

const MILESTONES = [
  { count: 10,  title: "Veteran Gamer",        bonusXp: 5  },
  { count: 25,  title: "Loyal Adventurer",     bonusXp: 10 },
  { count: 50,  title: "Guild Veteran",        bonusXp: 20 },
  { count: 100, title: "Legend of the Lounge", bonusXp: 50 },
];

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30)  return "Adventurer";
  if (xp < 80)  return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

export async function awardVisitXP(playerId: string, isNewDay: boolean, todayStr?: string): Promise<void> {
  try {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return;

    const rule       = getTierRule(player.membershipTier);
    const newVisitCount = player.visitCount + 1;
    const now        = new Date();

    let xpGained = 0;

    if (isNewDay) {
      // Award visit XP once per day
      const visitXp = Math.round((1 + rule.xpVisitBonus) * rule.xpMultiplier);
      if (visitXp > 0) {
        await prisma.xpLedger.create({
          data: {
            playerId,
            amount: visitXp,
            source: "visit",
            note: `Daily visit — ${player.membershipTier}`,
          },
        });
        xpGained += visitXp;
      }
    }

    // Check for milestone
    const milestone = MILESTONES.find((m) => m.count === newVisitCount);
    if (milestone) {
      // Award bonus XP
      const bonusXp = Math.round(milestone.bonusXp * rule.xpMultiplier);
      await prisma.xpLedger.create({
        data: {
          playerId,
          amount: bonusXp,
          source: "milestone",
          note: `Milestone: ${newVisitCount} visits — "${milestone.title}"`,
        },
      });
      xpGained += bonusXp;

      // Grant title if not already awarded
      const existing = await prisma.playerTitle.findFirst({
        where: { playerId, title: milestone.title },
      });
      if (!existing) {
        await prisma.playerTitle.create({ data: { playerId, title: milestone.title } });
      }

      // Notification to player
      await prisma.notification.create({
        data: {
          playerId,
          type: "title",
          heading: "Milestone Reached!",
          message: `You have reached ${newVisitCount} visits and earned the title "${milestone.title}" and +${bonusXp} bonus XP. The Guild salutes your dedication.`,
          severity: "success",
        },
      }).catch(() => {});

      // Public announcement
      await prisma.announcement.create({
        data: {
          type: "milestone",
          message: `⚔ @${player.gamerTag} just hit ${newVisitCount} visits at Gweru's Gamers Lounge and earned the title "${milestone.title}". Legends are made here.`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => {});
    }

    // Update player: visitCount, lastVisitAt, xp, rank
    const newXp      = player.xp + xpGained;
    const newRank    = computeRank(newXp, newVisitCount);
    const rankChanged = newRank !== player.rank;

    await prisma.player.update({
      where: { id: playerId },
      data: {
        visitCount:      newVisitCount,
        lastVisitAt:     now,
        xp:              xpGained > 0 ? { increment: xpGained } : undefined,
        rank:            newRank,
        // Ensure lastSessionDate is set for non-members so daily XP isn't re-awarded
        ...(isNewDay && todayStr ? { lastSessionDate: todayStr } : {}),
      },
    });

    // Rank-up notification
    if (rankChanged && xpGained > 0) {
      await prisma.notification.create({
        data: {
          playerId,
          type:    "rank_up",
          heading: "Rank Up!",
          message: `You have ascended to ${newRank}. The lounge recognises your dedication.`,
          severity: "success",
        },
      }).catch(() => {});

      await prisma.announcement.create({
        data: {
          type: "rank_up",
          message: `⬆ @${player.gamerTag} has ascended to ${newRank} at Gweru's Gamers Lounge!`,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[awardVisitXP]", err);
  }
}
