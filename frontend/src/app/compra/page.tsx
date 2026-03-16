import { prisma } from "@/lib/prisma";
import { getCategories } from "@/actions/categories";
import { getActiveSession } from "@/actions/shopping";
import ShoppingView from "@/components/compra/ShoppingView";

export default async function CompraPage() {
  const [products, categories, activeSession] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ category: "asc" }, { priority: "desc" }, { name: "asc" }],
    }),
    getCategories(),
    getActiveSession(),
  ]);

  return (
    <div>
      <ShoppingView
        products={products}
        categories={categories}
        activeSession={activeSession}
      />
    </div>
  );
}
