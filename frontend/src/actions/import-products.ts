"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importProductsFromCSV(
  csvContent: string
): Promise<ImportResult> {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    return { success: false, imported: 0, skipped: 0, errors: ["Archivo vacío"] };
  }

  const firstLine = lines[0].toLowerCase();
  const dataLines =
    firstLine.includes("icon") && firstLine.includes("name")
      ? lines.slice(1)
      : lines;

  if (dataLines.length === 0) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ["Solo se encontró la cabecera, sin datos"],
    };
  }

  // Load valid categories from DB
  const categories = await prisma.category.findMany({ select: { slug: true } });
  const validSlugs = new Set(categories.map((c) => c.slug));

  const existing = await prisma.product.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = i + 1;
    const parts = dataLines[i].split(",").map((p) => p.trim());

    if (parts.length < 2) {
      errors.push(`Línea ${lineNum}: formato inválido (mínimo icon,name,category)`);
      continue;
    }

    const icon = parts[0] || null;
    const name = parts[1];
    const categoryStr = parts[2] || "OTROS";
    const units = parseInt(parts[3] || "0", 10);

    if (!name) {
      errors.push(`Línea ${lineNum}: nombre vacío`);
      continue;
    }

    if (!validSlugs.has(categoryStr)) {
      errors.push(`Línea ${lineNum}: categoría inválida "${categoryStr}"`);
      continue;
    }

    if (existingNames.has(name.toLowerCase())) {
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        name,
        icon,
        category: categoryStr,
        units: isNaN(units) ? 0 : Math.max(0, units),
      },
    });

    existingNames.add(name.toLowerCase());
    imported++;
  }

  revalidatePath("/inventario");

  return {
    success: errors.length === 0,
    imported,
    skipped,
    errors,
  };
}
