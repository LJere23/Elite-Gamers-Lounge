import { prisma } from "./db";

export async function runBirthdayCheck(): Promise<{ found: number }> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day   = now.getUTCDate();

  type BirthdayRow = { id: string; name: string; gamerTag: string };

  const players = await prisma.$queryRaw<BirthdayRow[]>`
    SELECT id, name, "gamerTag"
    FROM "Player"
    WHERE "dateOfBirth" IS NOT NULL
      AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
      AND EXTRACT(DAY   FROM "dateOfBirth") = ${day}
      AND status = 'active'
  `;

  for (const p of players) {
    // Player notification
    await prisma.notification.create({
      data: {
        playerId: p.id,
        type:     "info",
        heading:  "Happy Birthday!",
        message:  `🎂 Happy Birthday ${p.name}! The Guild wishes you an epic day. Come celebrate at the lounge — today is all about you. Your XP and rank are safe, adventurer.`,
        severity: "success",
      },
    }).catch(() => {});

    // Public announcement
    await prisma.announcement.create({
      data: {
        type:     "birthday",
        message:  `🎂 Happy Birthday @${p.gamerTag}! From all of us at Gweru's Gamers Lounge — may your day be legendary, your sessions lag-free, and your rank forever rising. 🎮`,
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }).catch(() => {});
  }

  return { found: players.length };
}
