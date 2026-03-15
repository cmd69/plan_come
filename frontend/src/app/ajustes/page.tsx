import { getCategories } from "@/actions/categories";
import CategoryManager from "@/components/ajustes/CategoryManager";

export default async function AjustesPage() {
  const categories = await getCategories();

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>
      </header>
      <CategoryManager categories={categories} />
    </div>
  );
}
