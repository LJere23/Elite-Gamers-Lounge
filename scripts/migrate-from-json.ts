import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function migrateMembershipTier(plan: string | undefined): string {
  if (!plan) return "Villager";
  const p = plan.toLowerCase();
  if (p === "elite" || p === "legend") return "Legend";
  if (p === "pro" || p === "hero") return "Hero";
  if (p === "casual" || p === "warrior") return "Warrior";
  return "Villager";
}

async function main() {
  const storePath = path.join(process.cwd(), "src", "data", "store.json");
  const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));

  // ── PLAYERS ─────────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.players || []).length} players...`);
  for (const player of store.players || []) {
    try {
      const baseTag = (player.name || "Player")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 15) || "Player";
      const gamerTag = baseTag + player.id.slice(0, 4);

      await prisma.player.upsert({
        where: { id: player.id },
        update: {},
        create: {
          id: player.id,
          name: player.name || "Unknown",
          gamerTag,
          email: player.email || `${player.id}@migrated.local`,
          phone: player.phone || null,
          city: "Gweru",
          age: player.age ? Number(player.age) : null,
          membershipTier: migrateMembershipTier(player.membershipPlan),
          membershipExpiresAt: player.membershipExpiresAt
            ? new Date(player.membershipExpiresAt)
            : null,
          status: player.status || "active",
          xp: 0,
          rank: "Villager",
          visitCount: 0,
          joinedAt: player.joinedAt ? new Date(player.joinedAt) : new Date(),
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped player ${player.id}:`, (e as Error).message);
    }
  }

  // ── DEVICES ─────────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.devices || []).length} devices...`);
  for (const device of store.devices || []) {
    try {
      await prisma.device.upsert({
        where: { id: device.id },
        update: {},
        create: {
          id: device.id,
          name: device.name,
          type: device.type,
          hourlyRate: Number(device.hourlyRate) || 1,
          supportedGames: JSON.stringify(device.supportedGames || []),
          status: (device.status || "available").toLowerCase(),
          location: device.location || "Main Floor",
          currentSessionId: device.currentSessionId || null,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped device ${device.id}:`, (e as Error).message);
    }
  }

  // ── MEMBERSHIP PLANS ────────────────────────────────────────────────────
  console.log(`Migrating ${(store.memberships || []).length} membership plans...`);
  for (const plan of store.memberships || []) {
    try {
      await prisma.membershipPlan.upsert({
        where: { id: plan.id },
        update: {},
        create: {
          id: plan.id,
          name: migrateMembershipTier(plan.name),
          priceUsd: Number(plan.priceUsd) || 0,
          period: plan.period || "monthly",
          description: plan.description || "",
          perks: JSON.stringify(plan.perks || []),
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped plan ${plan.id}:`, (e as Error).message);
    }
  }

  // Seed default plans if none were migrated
  const planCount = await prisma.membershipPlan.count();
  if (planCount === 0) {
    console.log("  Seeding default membership plans...");
    await prisma.membershipPlan.createMany({
      data: [
        {
          name: "Warrior",
          priceUsd: 5,
          period: "monthly",
          description: "Entry-level membership with core benefits",
          perks: JSON.stringify(["Priority booking", "10% session discount", "1.1x XP boost"]),
        },
        {
          name: "Hero",
          priceUsd: 10,
          period: "monthly",
          description: "Mid-tier membership for dedicated players",
          perks: JSON.stringify([
            "Priority booking",
            "20% session discount",
            "Free 1hr WiFi/month",
            "1.2x XP boost",
          ]),
        },
        {
          name: "Legend",
          priceUsd: 20,
          period: "monthly",
          description: "Premium membership with all perks",
          perks: JSON.stringify([
            "VIP booking",
            "35% session discount",
            "Unlimited WiFi",
            "Tournament fee waiver",
            "1.35x XP boost",
            "Legend badge",
          ]),
        },
      ],
    });
  }

  // ── SESSIONS ─────────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.sessions || []).length} sessions...`);
  for (const session of store.sessions || []) {
    try {
      await prisma.session.upsert({
        where: { id: session.id },
        update: {},
        create: {
          id: session.id,
          playerName: session.playerName || "Unknown",
          game: session.game || "Unknown",
          deviceId: session.deviceId,
          deviceName: session.deviceName || "Unknown",
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime),
          durationHours: Number(session.durationHours) || 1,
          totalPrice: Number(session.totalPrice) || 0,
          remainingMinutes: Number(session.remainingMinutes) || 0,
          status: session.status || "ENDED",
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped session ${session.id}:`, (e as Error).message);
    }
  }

  // ── WIFI ─────────────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.wifi || []).length} WiFi sessions...`);
  for (const wifi of store.wifi || []) {
    try {
      await prisma.wifiSession.upsert({
        where: { id: wifi.id },
        update: {},
        create: {
          id: wifi.id,
          name: wifi.name || "Unknown",
          device: wifi.device || "Laptop",
          station: wifi.station || "Main Floor",
          status: wifi.status || "expired",
          startedAt: new Date(wifi.startedAt),
          expiresAt: new Date(wifi.expiresAt),
          durationHours: Number(wifi.durationHours) || 1,
          remainingMinutes: Number(wifi.remainingMinutes) || 0,
          priceUsd: Number(wifi.priceUsd) || 0,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped wifi ${wifi.id}:`, (e as Error).message);
    }
  }

  // ── TOURNAMENTS ──────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.tournaments || []).length} tournaments...`);
  for (const t of store.tournaments || []) {
    try {
      await prisma.tournament.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          name: t.name,
          game: t.game,
          category: t.category || "Sports Games",
          format: t.format || "knockout",
          status: t.status || "scheduled",
          startAt: new Date(t.startAt),
          endAt: new Date(t.endAt),
          entries: Number(t.entries) || 0,
          prizeUsd: Number(t.prizeUsd) || 0,
          prizeDescription: t.prizeDescription || "",
          scoringSystem: t.scoringSystem || "best_of_1",
          currentRound: t.currentRound ? Number(t.currentRound) : null,
          winnerId: t.winnerId || null,
          winnerName: t.winnerName || null,
          runnerUpId: t.runnerUpId || null,
          runnerUpName: t.runnerUpName || null,
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped tournament ${t.id}:`, (e as Error).message);
    }
  }

  // ── STUB TOURNAMENTS for orphaned entries/matches ────────────────────────
  // Some entries/matches reference tournament IDs not in store.json (deleted tournaments)
  const knownTournamentIds = new Set(
    (await prisma.tournament.findMany({ select: { id: true } })).map((t) => t.id)
  );
  const allEntryTournamentIds: string[] = [...new Set<string>((store.entries || []).map((e: any) => String(e.tournamentId)))];
  const allMatchTournamentIds: string[] = [...new Set<string>((store.matches || []).map((m: any) => String(m.tournamentId)))];
  const allReferencedIds: string[] = [...new Set<string>([...allEntryTournamentIds, ...allMatchTournamentIds])];
  const missingTournamentIds: string[] = allReferencedIds.filter((id) => !knownTournamentIds.has(id));

  if (missingTournamentIds.length > 0) {
    console.log(`Creating ${missingTournamentIds.length} stub tournaments for orphaned data...`);
    for (const id of missingTournamentIds) {
      await prisma.tournament.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: "[Deleted Tournament]",
          game: "Unknown",
          category: "Sports Games",
          format: "knockout",
          status: "completed",
          startAt: new Date("2026-01-01"),
          endAt: new Date("2026-01-01"),
          entries: 0,
          prizeUsd: 0,
          prizeDescription: "",
          scoringSystem: "best_of_1",
        },
      });
    }
  }

  // ── ENTRIES (need player stubs for orphaned entries) ──────────────────────
  const existingPlayerIds = new Set(
    (await prisma.player.findMany({ select: { id: true } })).map((p) => p.id)
  );

  console.log(`Migrating ${(store.entries || []).length} tournament entries...`);
  for (const entry of store.entries || []) {
    try {
      // Create a stub player if the player doesn't exist
      if (!existingPlayerIds.has(entry.playerId)) {
        // Use UUID-derived tag to guarantee uniqueness
        const stubTag = "pl" + entry.playerId.replace(/-/g, "").slice(0, 10);
        const stubEmail = entry.playerId.replace(/-/g, "").slice(0, 16) + "@stub.local";
        try {
          await prisma.player.upsert({
            where: { id: entry.playerId },
            update: {},
            create: {
              id: entry.playerId,
              name: entry.playerName || "Unknown",
              gamerTag: stubTag,
              email: stubEmail,
              city: "Gweru",
              membershipTier: "Adventurer",
              status: "active",
              xp: 0,
              rank: "Adventurer",
              visitCount: 3,
            },
          });
          existingPlayerIds.add(entry.playerId);
        } catch (stubErr) {
          // Check if player now exists (race or pre-existing) before giving up
          const check = await prisma.player.findUnique({ where: { id: entry.playerId } });
          if (check) existingPlayerIds.add(entry.playerId);
        }
      }

      await prisma.tournamentEntry.upsert({
        where: { id: entry.id },
        update: {},
        create: {
          id: entry.id,
          tournamentId: entry.tournamentId,
          playerId: entry.playerId,
          playerName: entry.playerName || "Unknown",
          registeredAt: entry.registeredAt ? new Date(entry.registeredAt) : new Date(),
          status: entry.status || "registered",
          points: Number(entry.points) || 0,
          wins: Number(entry.wins) || 0,
          losses: Number(entry.losses) || 0,
          bestLapTime: entry.bestLapTime != null ? Number(entry.bestLapTime) : null,
          lapTimeNote: entry.lapTimeNote || null,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped entry ${entry.id}:`, (e as Error).message);
    }
  }

  // ── MATCHES ──────────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.matches || []).length} tournament matches...`);
  for (const match of store.matches || []) {
    try {
      await prisma.tournamentMatch.upsert({
        where: { id: match.id },
        update: {},
        create: {
          id: match.id,
          tournamentId: match.tournamentId,
          playerAId: match.playerAId || "",
          playerAName: match.playerAName || "TBD",
          playerBId: match.playerBId || "",
          playerBName: match.playerBName || "TBD",
          scheduledAt: match.scheduledAt ? new Date(match.scheduledAt) : new Date(),
          status: match.status || "scheduled",
          scoreA: match.scoreA != null ? Number(match.scoreA) : null,
          scoreB: match.scoreB != null ? Number(match.scoreB) : null,
          winnerId: match.winnerId || null,
          winnerName: match.winnerName || null,
          round: Number(match.round) || 1,
          stage: match.stage || "Round 1",
          isBye: !!match.isBye,
          bracket: match.bracket || "winner",
          game1ScoreA: match.game1ScoreA != null ? Number(match.game1ScoreA) : null,
          game1ScoreB: match.game1ScoreB != null ? Number(match.game1ScoreB) : null,
          game2ScoreA: match.game2ScoreA != null ? Number(match.game2ScoreA) : null,
          game2ScoreB: match.game2ScoreB != null ? Number(match.game2ScoreB) : null,
          game3ScoreA: match.game3ScoreA != null ? Number(match.game3ScoreA) : null,
          game3ScoreB: match.game3ScoreB != null ? Number(match.game3ScoreB) : null,
          seriesWinsA: Number(match.seriesWinsA) || 0,
          seriesWinsB: Number(match.seriesWinsB) || 0,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped match ${match.id}:`, (e as Error).message);
    }
  }

  // ── ANNOUNCEMENTS ────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.announcements || []).length} announcements...`);
  for (const a of store.announcements || []) {
    try {
      await prisma.announcement.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id,
          message: a.message,
          tournamentId: a.tournamentId || null,
          tournamentName: a.tournamentName || null,
          winnerName: a.winnerName || null,
          prizeAmount: a.prizeAmount || null,
          type: a.type || "general",
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          expiresAt: a.expiresAt ? new Date(a.expiresAt) : null,
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped announcement ${a.id}:`, (e as Error).message);
    }
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  console.log(`Migrating ${(store.notifications || []).length} notifications...`);
  for (const n of store.notifications || []) {
    try {
      await prisma.notification.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          message: n.message,
          severity: n.severity || "info",
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        },
      });
    } catch (e) {
      console.warn(`  ⚠ Skipped notification ${n.id}:`, (e as Error).message);
    }
  }

  // ── DEFAULT JOBS ─────────────────────────────────────────────────────────
  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    console.log("Seeding default jobs...");
    await prisma.job.createMany({
      data: [
        { name: "First Arrival", description: "Be the first to arrive and start a session today", xpReward: 2 },
        { name: "Competition Winner", description: "Win a tournament or competition", xpReward: 3 },
        { name: "Weekly Challenge", description: "Complete the weekly gaming challenge", xpReward: 2 },
        { name: "Bring a Friend", description: "Bring a new player to the lounge", xpReward: 2 },
        { name: "Streak Bonus", description: "Visit 3 days in a row", xpReward: 1 },
        { name: "Birthday Visit", description: "Visit the lounge on your birthday", xpReward: 3 },
      ],
    });
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.player.count(),
    prisma.device.count(),
    prisma.session.count(),
    prisma.tournament.count(),
    prisma.tournamentEntry.count(),
    prisma.tournamentMatch.count(),
    prisma.membershipPlan.count(),
    prisma.job.count(),
  ]);

  console.log("\n✅ Migration complete!");
  console.log(`   Players:   ${counts[0]}`);
  console.log(`   Devices:   ${counts[1]}`);
  console.log(`   Sessions:  ${counts[2]}`);
  console.log(`   Tournaments: ${counts[3]}`);
  console.log(`   Entries:   ${counts[4]}`);
  console.log(`   Matches:   ${counts[5]}`);
  console.log(`   Plans:     ${counts[6]}`);
  console.log(`   Jobs:      ${counts[7]}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
