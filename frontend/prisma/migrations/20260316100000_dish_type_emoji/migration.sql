-- RedefineTables: Replace category+isSide with type+emoji
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MIXTO',
    "emoji" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Dish" ("id", "name", "type", "emoji", "notes", "active", "createdAt")
SELECT
    "id",
    "name",
    CASE
        WHEN "isSide" = 1 THEN 'ACOMPANANTE'
        ELSE 'MIXTO'
    END,
    CASE "category"
        WHEN 'PASTA' THEN '🍝'
        WHEN 'ARROZ' THEN '🍚'
        WHEN 'CARNE' THEN '🥩'
        WHEN 'PESCADO' THEN '🐟'
        WHEN 'LEGUMBRES' THEN '🫘'
        WHEN 'HUEVOS' THEN '🥚'
        ELSE '🍽️'
    END,
    "notes",
    "active",
    "createdAt"
FROM "Dish";

DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
