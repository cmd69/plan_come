"use server";

import { prisma } from "@/lib/prisma";
import { DishType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type IngredientInput = {
  productId: number;
  quantity: number;
  optional: boolean;
  group: string | null;
  groupMin: number;
};

export type SideInput = {
  sideId: number;
  group: string | null;
  groupMin: number;
};

export type DishInput = {
  name: string;
  type: DishType;
  emoji: string | null;
  notes: string | null;
  ingredients: IngredientInput[];
  sides: SideInput[];
};

export async function createDish(data: DishInput) {
  if (!data.name.trim() || !data.type) return;

  await prisma.dish.create({
    data: {
      name: data.name.trim(),
      type: data.type,
      emoji: data.emoji?.trim() || null,
      notes: data.notes?.trim() || null,
      ingredients: { create: data.ingredients },
      sides: data.type !== "ACOMPANANTE" && data.sides.length > 0 ? { create: data.sides } : undefined,
    },
  });
  revalidatePath("/platos");
}

export async function updateDish(id: number, data: DishInput) {
  if (!data.name.trim() || !data.type) return;

  await prisma.dish.update({
    where: { id },
    data: {
      name: data.name.trim(),
      type: data.type,
      emoji: data.emoji?.trim() || null,
      notes: data.notes?.trim() || null,
      ingredients: {
        deleteMany: {},
        create: data.ingredients,
      },
      sides: {
        deleteMany: {},
        create: data.type !== "ACOMPANANTE" ? data.sides : [],
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
