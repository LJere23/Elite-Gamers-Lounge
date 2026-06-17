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

async function main() {
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

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
