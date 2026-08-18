-- CreateTable
CREATE TABLE "draws" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inviteId" INTEGER NOT NULL,
    "prize" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "drawnAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "draws_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "draws_inviteId_key" ON "draws"("inviteId");
