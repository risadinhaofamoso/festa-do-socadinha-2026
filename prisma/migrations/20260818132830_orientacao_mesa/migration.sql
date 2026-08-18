-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "label" TEXT,
    "positionX" INTEGER,
    "positionY" INTEGER,
    "orientation" TEXT NOT NULL DEFAULT 'H',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tables" ("capacity", "createdAt", "id", "label", "number", "positionX", "positionY", "updatedAt") SELECT "capacity", "createdAt", "id", "label", "number", "positionX", "positionY", "updatedAt" FROM "tables";
DROP TABLE "tables";
ALTER TABLE "new_tables" RENAME TO "tables";
CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
