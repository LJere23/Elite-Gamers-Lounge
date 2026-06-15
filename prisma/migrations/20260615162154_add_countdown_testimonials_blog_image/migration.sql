-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoungeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Gweru''s Gamers Lounge',
    "tagline" TEXT NOT NULL DEFAULT 'Gweru''s Premier Gaming Experience',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT 'Gweru, Zimbabwe',
    "sessionRate" REAL NOT NULL DEFAULT 1.0,
    "wifiRate" REAL NOT NULL DEFAULT 0.5,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "openingTime" TEXT NOT NULL DEFAULT '09:00',
    "closingTime" TEXT NOT NULL DEFAULT '22:00',
    "whatsappNumber" TEXT NOT NULL DEFAULT '263784497531',
    "adminPassword" TEXT NOT NULL DEFAULT 'admin123',
    "communityHeadline" TEXT NOT NULL DEFAULT 'Join Our Gaming Community',
    "communityBody" TEXT NOT NULL DEFAULT 'Gweru''s Gamers Lounge is more than a gaming venue — it''s a community of competitive players, casual gamers, and esports enthusiasts all under one roof.',
    "communityStat1Label" TEXT NOT NULL DEFAULT 'Members',
    "communityStat1Value" TEXT NOT NULL DEFAULT '200+',
    "communityStat2Label" TEXT NOT NULL DEFAULT 'Tournaments',
    "communityStat2Value" TEXT NOT NULL DEFAULT '50+',
    "communityStat3Label" TEXT NOT NULL DEFAULT 'Games Available',
    "communityStat3Value" TEXT NOT NULL DEFAULT '30+',
    "countdownEnabled" BOOLEAN NOT NULL DEFAULT false,
    "countdownTitle" TEXT NOT NULL DEFAULT 'Next Event',
    "countdownDate" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_LoungeSettings" ("address", "adminPassword", "closingTime", "communityBody", "communityHeadline", "communityStat1Label", "communityStat1Value", "communityStat2Label", "communityStat2Value", "communityStat3Label", "communityStat3Value", "contactEmail", "contactPhone", "currency", "id", "name", "openingTime", "sessionRate", "tagline", "whatsappNumber", "wifiRate") SELECT "address", "adminPassword", "closingTime", "communityBody", "communityHeadline", "communityStat1Label", "communityStat1Value", "communityStat2Label", "communityStat2Value", "communityStat3Label", "communityStat3Value", "contactEmail", "contactPhone", "currency", "id", "name", "openingTime", "sessionRate", "tagline", "whatsappNumber", "wifiRate" FROM "LoungeSettings";
DROP TABLE "LoungeSettings";
ALTER TABLE "new_LoungeSettings" RENAME TO "LoungeSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
