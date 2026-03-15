import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TEMPLATE_HEADER = "icon,name,category,units";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const slugs = categories.map((c) => c.slug);

  const exampleRows = categories.slice(0, 7).map(
    (c) => `${c.emoji},Ejemplo ${c.label},${c.slug},0`
  );

  const commentLines = [
    `# Categorías válidas: ${slugs.join(", ")}`,
    "# icon: emoji (opcional, dejar vacío si no hay)",
    "# units: número entero >= 0 (opcional, por defecto 0)",
    "# Las líneas que empiezan con # se ignoran",
  ];

  const csv = [...commentLines, "", TEMPLATE_HEADER, ...exampleRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-productos.csv"',
    },
  });
}
