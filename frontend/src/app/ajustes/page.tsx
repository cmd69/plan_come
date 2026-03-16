import { getCategories } from "@/actions/categories";
import CategoryManager from "@/components/ajustes/CategoryManager";
import ThemeToggle from "@/components/ajustes/ThemeToggle";
import LogoutButton from "@/components/ajustes/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const categories = await getCategories();

  return (
    <div>
      <header className="sticky top-0 bg-surface border-b border-border-default px-4 py-4 z-10">
        <h1 className="text-xl font-bold text-primary">
          <span className="mr-1.5">⚙️</span>Ajustes
        </h1>
      </header>
      <div className="px-4 mt-4">
        <ThemeToggle />
      </div>
      <CategoryManager categories={categories} />
      <div className="px-4 mt-6 mb-8">
        <LogoutButton />
      </div>
    </div>
  );
}
