"use server";

import { prisma } from "@/lib/prisma";
import { DishCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createDish(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as DishCategory;
  const mainProductId = formData.get("mainProductId");

  if (!name || !category) return;

  await prisma.dish.create({
    data: {
      name,
      category,
      mainProductId: mainProductId ? Number(mainProductId) : null,
    },
  });
  revalidatePath("/platos");
}

export async function updateDish(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as DishCategory;
  const mainProductId = formData.get("mainProductId");

  if (!name || !category) return;

  await prisma.dish.update({
    where: { id },
    data: {
      name,
      category,
      mainProductId: mainProductId ? Number(mainProductId) : null,
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
