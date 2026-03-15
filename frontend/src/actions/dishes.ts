"use server";

import { prisma } from "@/lib/prisma";
import { DishCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type IngredientInput = {
  productId: number;
  quantity: number;
  optional: boolean;
};

export type DishInput = {
  name: string;
  category: DishCategory;
  notes: string | null;
  ingredients: IngredientInput[];
};

export async function createDish(data: DishInput) {
  if (!data.name.trim() || !data.category) return;

  await prisma.dish.create({
    data: {
      name: data.name.trim(),
      category: data.category,
      notes: data.notes?.trim() || null,
      ingredients: { create: data.ingredients },
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
      ingredients: {
        deleteMany: {},
        create: data.ingredients,
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
