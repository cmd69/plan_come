-- CreateTable
CREATE TABLE "DishSide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dishId" INTEGER NOT NULL,
    "sideId" INTEGER NOT NULL,
    "group" TEXT,
    CONSTRAINT "DishSide_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DishSide_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isSide" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Dish" ("active", "category", "createdAt", "id", "name", "notes") SELECT "active", "category", "createdAt", "id", "name", "notes" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DishSide_dishId_sideId_key" ON "DishSide"("dishId", "sideId");
