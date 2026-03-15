"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CategoryData = {
  slug: string;
  label: string;
  emoji: string;
  sortOrder: number;
};

const DEFAULT_CATEGORIES: CategoryData[] = [
  { slug: "CARNES_PROTEINAS", label: "Carnes y proteínas", emoji: "🥩", sortOrder: 0 },
  { slug: "LACTEOS", label: "Lácteos", emoji: "🥛", sortOrder: 1 },
  { slug: "FRUTAS_VERDURAS", label: "Frutas y verduras", emoji: "🥦", sortOrder: 2 },
  { slug: "DESPENSA", label: "Despensa", emoji: "🫙", sortOrder: 3 },
  { slug: "BEBIDAS", label: "Bebidas", emoji: "🥤", sortOrder: 4 },
  { slug: "HIGIENE_LIMPIEZA", label: "Higiene y limpieza", emoji: "🧹", sortOrder: 5 },
  { slug: "OTROS", label: "Otros", emoji: "📦", sortOrder: 6 },
];

/** Seed default categories if table is empty */
export async function seedCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.create({ data: cat });
  }
}

/** Get all categories sorted */
export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Seed defaults if empty
  if (categories.length === 0) {
    await seedCategories();
    return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  return categories;
}

export async function createCategory(formData: FormData) {
  const label = (formData.get("label") as string)?.trim();
  const emoji = (formData.get("emoji") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toUpperCase().replace(/\s+/g, "_");

  if (!label || !emoji || !slug) return;

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.category.create({
    data: { slug, label, emoji, sortOrder: nextOrder },
  });

  revalidatePath("/ajustes");
  revalidatePath("/inventario");
}

export async function updateCategory(id: number, formData: FormData) {
  const label = (formData.get("label") as string)?.trim();
  const emoji = (formData.get("emoji") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toUpperCase().replace(/\s+/g, "_");

  if (!label || !emoji || !slug) return;

  // If slug changed, update all products with old slug
  const existing = await prisma.category.findUnique({ where: { id } });
  if (existing && existing.slug !== slug) {
    await prisma.product.updateMany({
      where: { category: existing.slug },
      data: { category: slug },
    });
  }

  await prisma.category.update({
    where: { id },
    data: { slug, label, emoji },
  });

  revalidatePath("/ajustes");
  revalidatePath("/inventario");
}

export async function deleteCategory(id: number) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return;

  // Move products in this category to OTROS
  const fallback = await prisma.category.findFirst({
    where: { slug: "OTROS" },
  });

  if (fallback && fallback.id !== id) {
    await prisma.product.updateMany({
      where: { category: cat.slug },
      data: { category: fallback.slug },
    });
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/ajustes");
  revalidatePath("/inventario");
}

export async function reorderCategories(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.category.update({
      where: { id: orderedIds[i] },
      data: { sortOrder: i },
    });
  }
  revalidatePath("/ajustes");
  revalidatePath("/inventario");
}
