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

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
