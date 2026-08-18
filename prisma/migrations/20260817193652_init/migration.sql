-- CreateTable
CREATE TABLE "tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "seats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableId" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    CONSTRAINT "seats_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "guestId" INTEGER NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "giftType" TEXT NOT NULL DEFAULT 'SOMENTE_CONVITE',
    "seatId" INTEGER,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invites_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invites_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");

-- CreateIndex
CREATE UNIQUE INDEX "seats_tableId_seatNumber_key" ON "seats"("tableId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invites_number_key" ON "invites"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invites_seatId_key" ON "invites"("seatId");
