import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function computeRank(xp: number, visitCount: number): string {
  if (visitCount < 3) return "Villager";
  if (xp < 30) return "Adventurer";
  if (xp < 80) return "F Rank";
  if (xp < 150) return "E Rank";
  if (xp < 250) return "D Rank";
  if (xp < 400) return "C Rank";
  if (xp < 600) return "B Rank";
  if (xp < 850) return "A Rank";
  return "S Rank";
}

async function main() {
  const players = await prisma.player.findMany();

  const toFix = players.filter((p) => p.xp > 0 && p.visitCount < 3);

  if (toFix.length === 0) {
    console.log("No players need fixing.");
    return;
  }

  for (const player of toFix) {
    const newVisitCount = Math.max(3, player.visitCount);
    const newRank = computeRank(player.xp, newVisitCount);
    await prisma.player.update({
      where: { id: player.id },
      data: { visitCount: newVisitCount, rank: newRank },
    });
    console.log(`Fixed: ${player.name} — visitCount: ${player.visitCount} → ${newVisitCount}, rank: ${player.rank} → ${newRank}`);
  }

  console.log(`Done. Fixed ${toFix.length} player(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
