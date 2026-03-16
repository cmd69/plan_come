-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DishIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dishId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "group" TEXT,
    "groupMin" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "DishIngredient_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DishIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DishIngredient" ("dishId", "group", "id", "optional", "productId", "quantity") SELECT "dishId", "group", "id", "optional", "productId", "quantity" FROM "DishIngredient";
DROP TABLE "DishIngredient";
ALTER TABLE "new_DishIngredient" RENAME TO "DishIngredient";
CREATE UNIQUE INDEX "DishIngredient_dishId_productId_key" ON "DishIngredient"("dishId", "productId");
CREATE TABLE "new_DishSide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dishId" INTEGER NOT NULL,
    "sideId" INTEGER NOT NULL,
    "group" TEXT,
    "groupMin" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "DishSide_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DishSide_sideId_fkey" FOREIGN KEY ("sideId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DishSide" ("dishId", "group", "id", "sideId") SELECT "dishId", "group", "id", "sideId" FROM "DishSide";
DROP TABLE "DishSide";
ALTER TABLE "new_DishSide" RENAME TO "DishSide";
CREATE UNIQUE INDEX "DishSide_dishId_sideId_key" ON "DishSide"("dishId", "sideId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
