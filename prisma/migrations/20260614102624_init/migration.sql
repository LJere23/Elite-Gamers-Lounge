-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gamerTag" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" DATETIME,
    "city" TEXT NOT NULL DEFAULT 'Gweru',
    "age" INTEGER,
    "membershipTier" TEXT NOT NULL DEFAULT 'Villager',
    "membershipExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "rank" TEXT NOT NULL DEFAULT 'Villager',
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteGame" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" DATETIME
);

-- CreateTable
CREATE TABLE "PlayerTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerTitle_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XpLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "jobId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XpLedger_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "JobCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobCompletion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobCompletion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hourlyRate" REAL NOT NULL,
    "supportedGames" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'available',
    "location" TEXT NOT NULL DEFAULT 'Main Floor',
    "currentSessionId" TEXT
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "durationHours" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "remainingMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WifiSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT 'Laptop',
    "station" TEXT NOT NULL DEFAULT 'Main Floor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "durationHours" REAL NOT NULL,
    "remainingMinutes" INTEGER NOT NULL DEFAULT 0,
    "priceUsd" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "entries" INTEGER NOT NULL DEFAULT 0,
    "prizeUsd" REAL NOT NULL DEFAULT 0,
    "prizeDescription" TEXT NOT NULL DEFAULT '',
    "scoringSystem" TEXT NOT NULL DEFAULT 'best_of_1',
    "currentRound" INTEGER,
    "winnerId" TEXT,
    "winnerName" TEXT,
    "runnerUpId" TEXT,
    "runnerUpName" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "bestLapTime" REAL,
    "lapTimeNote" TEXT,
    CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerAName" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "playerBName" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "winnerId" TEXT,
    "winnerName" TEXT,
    "round" INTEGER NOT NULL DEFAULT 1,
    "stage" TEXT NOT NULL DEFAULT 'Round 1',
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "bracket" TEXT NOT NULL DEFAULT 'winner',
    "game1ScoreA" INTEGER,
    "game1ScoreB" INTEGER,
    "game2ScoreA" INTEGER,
    "game2ScoreB" INTEGER,
    "game3ScoreA" INTEGER,
    "game3ScoreB" INTEGER,
    "seriesWinsA" INTEGER NOT NULL DEFAULT 0,
    "seriesWinsB" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priceUsd" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "perks" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "tournamentId" TEXT,
    "tournamentName" TEXT,
    "winnerName" TEXT,
    "prizeAmount" TEXT,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LoungeSettings" (
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
    "closingTime" TEXT NOT NULL DEFAULT '22:00'
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_gamerTag_key" ON "Player"("gamerTag");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");
