"use server";

import { prisma } from "@/lib/prisma";
import { DishCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type IngredientInput = {
  productId: number;
  quantity: number;
  optional: boolean;
  group: string | null;
};

export type SideInput = {
  sideId: number;
  group: string | null;
};

export type DishInput = {
  name: string;
  category: DishCategory;
  notes: string | null;
  isSide: boolean;
  ingredients: IngredientInput[];
  sides: SideInput[];
};

export async function createDish(data: DishInput) {
  if (!data.name.trim() || !data.category) return;

  await prisma.dish.create({
    data: {
      name: data.name.trim(),
      category: data.category,
      notes: data.notes?.trim() || null,
      isSide: data.isSide,
      ingredients: { create: data.ingredients },
      sides: data.sides.length > 0 ? { create: data.sides } : undefined,
    },
  });
  revalidatePath("/platos");
}

export async function updateDish(id: number, data: DishInput) {
  if (!data.name.trim() || !data.category) return;

  await prisma.dish.update({
    where: { id },
    data: {
      name: data.name.trim(),
      category: data.category,
      notes: data.notes?.trim() || null,
      isSide: data.isSide,
      ingredients: {
        deleteMany: {},
        create: data.ingredients,
      },
      sides: {
        deleteMany: {},
        create: data.sides,
      },
    },
  });
  revalidatePath("/platos");
}

export async function toggleDishActive(id: number, active: boolean) {
  await prisma.dish.update({ where: { id }, data: { active } });
  revalidatePath("/platos");
}

export async function deleteDish(id: number) {
  await prisma.dish.delete({ where: { id } });
  revalidatePath("/platos");
}
