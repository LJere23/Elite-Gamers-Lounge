import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_JOBS = [
  {
    name: "First Blood",
    description: "Play your first session at the lounge",
    xpReward: 3,
    jobType: "milestone_first_session",
    active: true,
  },
  {
    name: "Tournament Contender",
    description: "Enter any official tournament",
    xpReward: 3,
    jobType: "tournament_entry",
    active: true,
  },
  {
    name: "Community Champion",
    description: "Refer a friend who registers at the lounge",
    xpReward: 3,
    jobType: "referral",
    active: true,
  },
];

const SEED_MEMBERSHIPS = [
  {
    name: "Warrior",
    priceUsd: 5,
    period: "Week",
    description: "Entry paid tier with discounted sessions and a head start on XP.",
    perks: JSON.stringify([
      "Discounted hourly rates",
      "Priority booking",
      "+10% XP per visit",
      "Early tournament registration",
    ]),
  },
  {
    name: "Hero",
    priceUsd: 25,
    period: "Month",
    description: "Mid-tier perks with a real XP advantage and bonus sessions.",
    perks: JSON.stringify([
      "Greater session discounts",
      "Exclusive promotions",
      "+20% XP per visit",
      "Free monthly bonus session",
    ]),
  },
  {
    name: "Legend",
    priceUsd: 50,
    period: "Month",
    description: "Premium VIP access with the highest XP boost in the lounge.",
    perks: JSON.stringify([
      "Highest-tier discounts",
      "Full VIP access",
      "Birthday rewards",
      "Exclusive tournaments",
      "+35% XP per visit",
    ]),
  },
];

const SEED_GAMES = [
  "FC25",
  "Tekken 8",
  "Mortal Kombat",
  "Gran Turismo",
  "Call Of Duty",
];

const SEED_CHALLENGES = [
  {
    name: "Regular",
    description: "Play 3 gaming sessions this week",
    icon: "🎮",
    type: "sessions",
    target: 3,
    xpReward: 15,
    weeklyReset: true,
    active: true,
    sortOrder: 1,
  },
  {
    name: "Dedicated",
    description: "Play 5 gaming sessions this week",
    icon: "⚔",
    type: "sessions",
    target: 5,
    xpReward: 30,
    weeklyReset: true,
    active: true,
    sortOrder: 2,
  },
  {
    name: "Tournament Fighter",
    description: "Enter a tournament this week",
    icon: "🏆",
    type: "tournament_entry",
    target: 1,
    xpReward: 20,
    weeklyReset: true,
    active: true,
    sortOrder: 3,
  },
  {
    name: "Recruiter",
    description: "Refer a new player to the Guild this week",
    icon: "🤝",
    type: "referral",
    target: 1,
    xpReward: 25,
    weeklyReset: true,
    active: true,
    sortOrder: 4,
  },
];

const SEED_TEMPLATES = [
  {
    templateName: "Friday Mini-Tourney",
    defaultGame: "FIFA / Mortal Kombat",
    category: "friday_mini",
    format: "knockout",
    scoringSystem: "best_of_1",
    maxPlayers: 8,
    walkInFee: 1.00,
    warriorFreeEntriesPerMonth: 1, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 1,    heroDiscountPercent: 50,
    legendFreeEntriesPerMonth: -1, legendDiscountPercent: 0,
    xpReward: 3,
    prizeDescription: "$4 shop credit to winner",
  },
  {
    templateName: "Darts League",
    defaultGame: "Darts",
    category: "other",
    format: "points_league",
    scoringSystem: "best_of_3",  // best of 3 legs (501) per match
    maxPlayers: 8,
    walkInFee: 0.50,
    warriorFreeEntriesPerMonth: 0, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 0,    heroDiscountPercent: 50,
    legendFreeEntriesPerMonth: 0,  legendDiscountPercent: 50,
    xpReward: 2,
    prizeDescription: "Free snack combo to winner",
  },
  {
    templateName: "Pool Tournament",
    defaultGame: "Pool",
    category: "other",
    format: "knockout",
    scoringSystem: "best_of_1",
    maxPlayers: 8,
    walkInFee: 1.00,
    warriorFreeEntriesPerMonth: 0, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 0,    heroDiscountPercent: 50,
    legendFreeEntriesPerMonth: 0,  legendDiscountPercent: 50,
    xpReward: 2,
    prizeDescription: "Prize pool from entries + $2 top-up",
  },
  {
    templateName: "Racing Sim League",
    defaultGame: "F1 24",          // staff overrides per event (Forza, F1, GT, etc.)
    category: "racing_sim_league",
    format: "fastest_lap",
    scoringSystem: "lap_time",     // ranked by fastest single lap — not match-based
    maxPlayers: 6,
    walkInFee: 5.00,
    warriorFreeEntriesPerMonth: 0, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 0,    heroDiscountPercent: 0,
    legendFreeEntriesPerMonth: 1,  legendDiscountPercent: 0,
    xpReward: 3,
    prizeDescription: "Winner: $10 cash + leaderboard feature",
    circuit: "TBD",                // staff sets circuit per event
  },
  {
    templateName: "Chess League",
    defaultGame: "Chess",
    category: "other",
    format: "swiss",
    scoringSystem: "best_of_1",
    maxPlayers: 8,
    walkInFee: 1.00,
    warriorFreeEntriesPerMonth: 0,  warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: -1,    heroDiscountPercent: 0,
    legendFreeEntriesPerMonth: -1,  legendDiscountPercent: 0,
    xpReward: 2,
    prizeDescription: "Leaderboard points + 30 min free gaming for monthly winner",
  },
  {
    templateName: "Monthly Grand Prix",
    defaultGame: "Multi-game",
    category: "other",
    format: "points_league",
    scoringSystem: "best_of_1",
    maxPlayers: 16,
    walkInFee: 3.00,
    warriorFreeEntriesPerMonth: 0, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 0,    heroDiscountPercent: 50,
    legendFreeEntriesPerMonth: 0,  legendDiscountPercent: 50,
    xpReward: 4,
    prizeDescription: "1st: $10 cash + free entry next month. 2nd: 2 free gaming hours.",
  },
  {
    templateName: "Seasonal Championship",
    defaultGame: "All games",
    category: "other",
    format: "double_elimination",
    scoringSystem: "best_of_3",
    maxPlayers: 32,
    walkInFee: 8.00,
    warriorFreeEntriesPerMonth: 0, warriorDiscountPercent: 0,
    heroFreeEntriesPerMonth: 0,    heroDiscountPercent: 25,
    legendFreeEntriesPerMonth: 0,  legendDiscountPercent: 50,
    xpReward: 5,
    prizeDescription: "1st: $20 cash. 2nd: $10 cash. 3rd: 1hr free gaming.",
  },
];

async function main() {
  console.log("Seeding games…");
  for (const name of SEED_GAMES) {
    const existing = await prisma.game.findUnique({ where: { name } });
    if (existing) {
      console.log(`  ⊘ Already exists: ${name}`);
    } else {
      await prisma.game.create({ data: { name } });
      console.log(`  ✓ Created: ${name}`);
    }
  }

  console.log("Seeding jobs…");

  for (const job of SEED_JOBS) {
    const existing = await prisma.job.findFirst({ where: { jobType: job.jobType } });
    if (existing) {
      console.log(`  ⊘ Already exists: ${job.name} (jobType=${job.jobType})`);
    } else {
      await prisma.job.create({ data: job });
      console.log(`  ✓ Created: ${job.name}`);
    }
  }

  console.log("Seeding membership plans…");

  for (const plan of SEED_MEMBERSHIPS) {
    const existing = await prisma.membershipPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.membershipPlan.update({ where: { id: existing.id }, data: plan });
      console.log(`  ↻ Updated: ${plan.name}`);
    } else {
      await prisma.membershipPlan.create({ data: plan });
      console.log(`  ✓ Created: ${plan.name}`);
    }
  }

  console.log("Seeding tournament templates…");
  for (const tpl of SEED_TEMPLATES) {
    const existing = await prisma.tournamentTemplate.findFirst({ where: { templateName: tpl.templateName } });
    if (existing) {
      await prisma.tournamentTemplate.update({ where: { id: existing.id }, data: tpl });
      console.log(`  ↻ Updated: ${tpl.templateName}`);
    } else {
      await prisma.tournamentTemplate.create({ data: tpl });
      console.log(`  ✓ Created: ${tpl.templateName}`);
    }
  }

  console.log("Seeding challenges…");
  for (const ch of SEED_CHALLENGES) {
    const existing = await prisma.challenge.findFirst({ where: { name: ch.name } });
    if (existing) {
      await prisma.challenge.update({ where: { id: existing.id }, data: ch });
      console.log(`  ↻ Updated: ${ch.name}`);
    } else {
      await prisma.challenge.create({ data: ch });
      console.log(`  ✓ Created: ${ch.name}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
