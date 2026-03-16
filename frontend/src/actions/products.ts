"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim() || null;

  if (!name || !category) return;

  await prisma.product.create({ data: { name, icon, category } });
  revalidatePath("/inventario");
}

export async function updateProduct(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim() || null;

  if (!name || !category) return;

  await prisma.product.update({ where: { id }, data: { name, icon, category } });
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

export async function deleteProduct(id: number) {
  await prisma.shoppingSessionItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/inventario");
}
