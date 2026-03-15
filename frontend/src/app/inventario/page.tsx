import { prisma } from "@/lib/prisma";
import { getCategories } from "@/actions/categories";
import ProductList from "@/components/inventario/ProductList";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const [products, categories, params] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    getCategories(),
    searchParams,
  ]);

  return (
    <div>
      <ProductList products={products} categories={categories} initialCategory={params.cat} />
    </div>
  );
}
