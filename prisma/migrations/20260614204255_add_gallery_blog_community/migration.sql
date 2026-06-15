-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Admin',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "communityStat3Value" TEXT NOT NULL DEFAULT '30+'
);
INSERT INTO "new_LoungeSettings" ("address", "closingTime", "contactEmail", "contactPhone", "currency", "id", "name", "openingTime", "sessionRate", "tagline", "wifiRate") SELECT "address", "closingTime", "contactEmail", "contactPhone", "currency", "id", "name", "openingTime", "sessionRate", "tagline", "wifiRate" FROM "LoungeSettings";
DROP TABLE "LoungeSettings";
ALTER TABLE "new_LoungeSettings" RENAME TO "LoungeSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
