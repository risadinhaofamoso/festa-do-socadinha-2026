-- CreateTable
CREATE TABLE "players" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "position" TEXT NOT NULL DEFAULT 'MEIA',
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "overall" INTEGER NOT NULL DEFAULT 70,
    "pace" INTEGER NOT NULL DEFAULT 70,
    "shooting" INTEGER NOT NULL DEFAULT 70,
    "passing" INTEGER NOT NULL DEFAULT 70,
    "dribbling" INTEGER NOT NULL DEFAULT 70,
    "defending" INTEGER NOT NULL DEFAULT 70,
    "physical" INTEGER NOT NULL DEFAULT 70,
    "crossing" INTEGER NOT NULL DEFAULT 70,
    "preferredFoot" TEXT NOT NULL DEFAULT 'D',
    "weakFoot" INTEGER NOT NULL DEFAULT 3,
    "skillMoves" INTEGER NOT NULL DEFAULT 3,
    "baseWins" INTEGER NOT NULL DEFAULT 0,
    "baseDraws" INTEGER NOT NULL DEFAULT 0,
    "baseLosses" INTEGER NOT NULL DEFAULT 0,
    "baseJogos" INTEGER NOT NULL DEFAULT 0,
    "baseParticipacoes" INTEGER NOT NULL DEFAULT 0,
    "baseMelhorEmCampo" INTEGER NOT NULL DEFAULT 0,
    "basePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'CRIADA',
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "durationSeconds" INTEGER,
    "votingOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "participations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "team" TEXT,
    "role" TEXT NOT NULL DEFAULT 'JOGADOR',
    "isMotm" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "participations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "participations_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "votedPlayerId" INTEGER NOT NULL,
    "voterCpf" TEXT NOT NULL,
    "voterName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_votedPlayerId_fkey" FOREIGN KEY ("votedPlayerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_number_key" ON "matches"("number");

-- CreateIndex
CREATE UNIQUE INDEX "participations_matchId_playerId_key" ON "participations"("matchId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_matchId_team_voterCpf_key" ON "votes"("matchId", "team", "voterCpf");
