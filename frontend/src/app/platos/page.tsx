import { prisma } from "@/lib/prisma";
import DishList from "@/components/platos/DishList";

export default async function PlatosPage() {
  const [dishes, products] = await Promise.all([
    prisma.dish.findMany({
      include: { mainProduct: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Platos</h1>
      </header>
      <DishList dishes={dishes} products={products} />
    </div>
  );
}
