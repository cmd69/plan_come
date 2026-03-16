import { prisma } from "@/lib/prisma";
import { getCategories } from "@/actions/categories";
import DishList from "@/components/platos/DishList";

export default async function PlatosPage() {
  const [dishes, products, categories] = await Promise.all([
    prisma.dish.findMany({
      include: {
        ingredients: { include: { product: true } },
        sides: {
          include: {
            side: {
              include: {
                ingredients: { include: { product: true } },
              },
            },
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    getCategories(),
  ]);

  return (
    <div>
      <DishList dishes={dishes} products={products} categories={categories} />
    </div>
  );
}
