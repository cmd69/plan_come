"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus, ChevronDown, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp10, SmilePlus, Smile, List, LayoutGrid, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";
import ProductCard from "./ProductCard";
import ProductForm from "./ProductForm";
import ImportProducts from "./ImportProducts";
import ProductGrid from "./ProductGrid";
import { resetAllUnits } from "@/actions/products";

type SortKey = "alpha" | "icon" | "units";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "grid";

const SORT_OPTIONS: { key: SortKey; label: string; iconAsc: typeof ArrowDownAZ; iconDesc: typeof ArrowUpAZ }[] = [
  { key: "alpha", label: "Nombre", iconAsc: ArrowDownAZ, iconDesc: ArrowUpAZ },
  { key: "icon", label: "Icono", iconAsc: SmilePlus, iconDesc: Smile },
  { key: "units", label: "Cantidad", iconAsc: ArrowDown01, iconDesc: ArrowUp10 },
];

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  const sorted = [...products].sort((a, b) => {
    // Primary: priority desc (alta first)
    if (a.priority !== b.priority) return b.priority - a.priority;
    // Secondary: selected sort key
    switch (key) {
      case "alpha":
        return a.name.localeCompare(b.name, "es");
      case "icon":
        return (a.icon ?? "").localeCompare(b.icon ?? "");
      case "units":
        return a.units - b.units;
    }
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

interface ProductListProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}

export default function ProductList({ products, categories, initialCategory }: ProductListProps) {
  const [formProduct, setFormProduct] = useState<Product | null | undefined>(
    undefined
  );
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  function toggleSection(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  function handleSortSelect(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setShowSortMenu(false);
  }

  const grouped = useMemo(
    () =>
      order.map((slug) => ({
        slug,
        label: labels[slug] ?? slug,
        emoji: emojis[slug] ?? "📦",
        products: sortProducts(
          products.filter((p) => p.category === slug),
          sortKey,
          sortDir
        ),
      })).filter((g) => g.products.length > 0),
    [products, sortKey, sortDir, order, labels, emojis]
  );

  const isEmpty = products.length === 0;
  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey)!;
  const CurrentIcon = sortDir === "asc" ? currentSort.iconAsc : currentSort.iconDesc;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        {!isEmpty && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-lg active:bg-gray-200"
              title="Poner todo a 0"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
              className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-lg active:bg-gray-200"
              title={viewMode === "list" ? "Vista cuadrícula" : "Vista lista"}
            >
              {viewMode === "list" ? <LayoutGrid size={15} /> : <List size={15} />}
            </button>

            {viewMode === "list" && (
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg active:bg-gray-200"
                >
                  <CurrentIcon size={14} />
                  {currentSort.label}
                </button>

                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[160px] py-1">
                      {SORT_OPTIONS.map((opt) => {
                        const isActive = opt.key === sortKey;
                        const Icon = isActive
                          ? sortDir === "asc"
                            ? opt.iconAsc
                            : opt.iconDesc
                          : opt.iconAsc;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSortSelect(opt.key)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2.5 text-sm active:bg-gray-50",
                              isActive
                                ? "text-emerald-600 font-medium"
                                : "text-gray-700"
                            )}
                          >
                            <Icon size={16} />
                            <span className="flex-1 text-left">{opt.label}</span>
                            {isActive && (
                              <span className="text-xs text-gray-400">
                                {sortDir === "asc" ? "A-Z" : "Z-A"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-5">
          <span className="text-4xl">📦</span>
          <p className="text-base">No hay productos todavía</p>
          <button
            onClick={() => setFormProduct(null)}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700"
          >
            Añadir el primero
          </button>
          <div className="w-full border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-400 text-center mb-3">
              o importa muchos a la vez
            </p>
            <ImportProducts />
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <ProductGrid
          products={products}
          categories={categories}
          initialCategory={initialCategory}
          onEdit={(p) => setFormProduct(p)}
          onAdd={(cat) => { setDefaultCategory(cat); setFormProduct(null); }}
        />
      ) : (
        <div>
          {grouped.map(({ slug, label, emoji, products: groupProducts }) => {
            const isCollapsed = collapsed.has(slug);
            return (
              <section key={slug}>
                <button
                  onClick={() => toggleSection(slug)}
                  className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 active:bg-gray-100"
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200 shrink-0",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  <span>{emoji}</span>
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-gray-400 normal-case font-normal tracking-normal">
                    {groupProducts.length}
                  </span>
                </button>
                {!isCollapsed &&
                  groupProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={(p) => setFormProduct(p)}
                    />
                  ))}
              </section>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {!isEmpty && (
        <button
          onClick={() => setFormProduct(null)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-emerald-700 transition-colors z-30"
          aria-label="Añadir producto"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Modal */}
      {formProduct !== undefined && (
        <ProductForm
          product={formProduct}
          categories={categories}
          defaultCategory={defaultCategory}
          onClose={() => { setFormProduct(undefined); setDefaultCategory(undefined); }}
        />
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[70]" onClick={() => setShowResetConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] px-4 pt-6 pb-8">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Poner todo a 0
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Se pondrán las unidades de todos los productos a 0
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-medium text-base active:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await resetAllUnits();
                    setShowResetConfirm(false);
                  });
                }}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-white",
                  isPending ? "bg-red-400" : "bg-red-600 active:bg-red-700"
                )}
              >
                {isPending ? "Reseteando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
