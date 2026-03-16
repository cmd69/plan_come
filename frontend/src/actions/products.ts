"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim() || null;
  const priority = parseInt(formData.get("priority") as string) || 0;

  if (!name || !category) return;

  await prisma.product.create({ data: { name, icon, category, priority } });
  revalidatePath("/inventario");
}

export async function updateProduct(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim() || null;
  const priority = parseInt(formData.get("priority") as string) || 0;

  if (!name || !category) return;

  await prisma.product.update({ where: { id }, data: { name, icon, category, priority } });
  revalidatePath("/inventario");
}

export async function updateUnits(id: number, delta: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { units: Math.max(0, product.units + delta) },
  });
  revalidatePath("/inventario");
}

export async function resetAllUnits() {
  await prisma.product.updateMany({ data: { units: 0 } });
  revalidatePath("/inventario");
}

export async function bulkUpdateProducts(ids: number[], formData: FormData) {
  const data: Record<string, unknown> = {};

  const icon = formData.get("icon") as string | null;
  const category = (formData.get("category") as string)?.trim();
  const priority = formData.get("priority") as string | null;

  if (icon !== null && icon !== "") data.icon = icon.trim();
  if (category) data.category = category;
  if (priority !== null && priority !== "") data.priority = parseInt(priority);

  if (Object.keys(data).length === 0 || ids.length === 0) return;

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data,
  });
  revalidatePath("/inventario");
}

export async function deleteProduct(id: number) {
  await prisma.shoppingSessionItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/inventario");
}
