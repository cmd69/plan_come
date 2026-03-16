"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Get the current active (incomplete) shopping session, if any */
export async function getActiveSession() {
  return prisma.shoppingSession.findFirst({
    where: { completedAt: null },
    include: {
      items: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new shopping session from selected product IDs (qty defaults to 1) */
export async function createSession(productIds: number[]) {
  if (productIds.length === 0) return;

  // Close any existing open sessions
  await prisma.shoppingSession.updateMany({
    where: { completedAt: null },
    data: { completedAt: new Date() },
  });

  await prisma.shoppingSession.create({
    data: {
      items: {
        create: productIds.map((productId) => ({
          productId,
          quantityToBuy: 1,
        })),
      },
    },
  });

  revalidatePath("/compra");
}

/** Add more products to an existing session (skips already-present products) */
export async function addItemsToSession(sessionId: number, productIds: number[]) {
  if (productIds.length === 0) return;

  const existing = await prisma.shoppingSessionItem.findMany({
    where: { sessionId },
    select: { productId: true },
  });
  const existingIds = new Set(existing.map((e) => e.productId));
  const newIds = productIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    await prisma.shoppingSessionItem.createMany({
      data: newIds.map((productId) => ({
        sessionId,
        productId,
        quantityToBuy: 1,
      })),
    });
  }

  revalidatePath("/compra");
}

/** Toggle an item as checked/unchecked */
export async function toggleItem(itemId: number) {
  const item = await prisma.shoppingSessionItem.findUnique({
    where: { id: itemId },
  });
  if (!item) return;

  await prisma.shoppingSessionItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });

  revalidatePath("/compra");
}

/** Update quantity to buy for an item */
export async function updateItemQuantity(itemId: number, quantity: number) {
  if (quantity < 1) return;

  await prisma.shoppingSessionItem.update({
    where: { id: itemId },
    data: { quantityToBuy: quantity },
  });

  revalidatePath("/compra");
}

/** Complete the shopping session: update inventory with bought quantities */
export async function completeSession(sessionId: number) {
  const session = await prisma.shoppingSession.findUnique({
    where: { id: sessionId },
    include: { items: true },
  });

  if (!session || session.completedAt) return;

  // Update inventory for checked items
  const checkedItems = session.items.filter((item) => item.checked);

  for (const item of checkedItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { units: { increment: item.quantityToBuy } },
    });
  }

  // Mark session as completed
  await prisma.shoppingSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
  });

  revalidatePath("/compra");
  revalidatePath("/inventario");
}

/** Cancel / discard an active session */
export async function cancelSession(sessionId: number) {
  await prisma.shoppingSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/compra");
}
