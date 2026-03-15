import { prisma } from "@/lib/prisma";
import ProductList from "@/components/inventario/ProductList";

export default async function InventarioPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
      </header>
      <ProductList products={products} />
    </div>
  );
}
