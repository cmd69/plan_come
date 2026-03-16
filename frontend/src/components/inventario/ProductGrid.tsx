"use client";

import { useState, useMemo, useTransition, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Minus, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps, sortByPriority, PRIORITY_COLORS, PRIORITY_ICONS } from "@/lib/constants";
import { updateUnits, deleteProduct } from "@/actions/products";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  onEdit: (product: Product) => void;
  onAdd: (category: string) => void;
}

export default function ProductGrid({ products, categories, initialCategory, onEdit, onAdd }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory ?? null);
  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  const openCategory = useCallback((slug: string) => {
    setActiveCategory(slug);
    history.pushState({ gridCategory: slug }, "");
  }, []);

  const closeCategory = useCallback(() => {
    setActiveCategory(null);
  }, []);

  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      // Only close category when navigating back past the category entry
      // (ignore popstate from modal/other history entries)
      if (activeCategory && !e.state?.gridCategory) {
        setActiveCategory(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [activeCategory]);

  const categoriesWithProducts = order.filter((slug) =>
    products.some((p) => p.category === slug)
  );

  const categoryProducts = activeCategory
    ? sortByPriority(products.filter((p) => p.category === activeCategory))
    : [];

  return (
    <div className="p-4">
      {!activeCategory ? (
        <div className="grid grid-cols-3 gap-3">
          {categoriesWithProducts.map((slug) => {
            const catProducts = products.filter((p) => p.category === slug);
            const total = catProducts.length;
            const inStock = catProducts.filter((p) => p.units > 0).length;
            return (
              <button
                key={slug}
                onClick={() => openCategory(slug)}
                className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 active:bg-gray-100 aspect-square"
              >
                {inStock > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {inStock}
                  </span>
                )}
                <span className="text-3xl">{emojis[slug] ?? "📦"}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {labels[slug] ?? slug}
                </span>
                <span className="text-[10px] text-gray-400">{total}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <button
            onClick={() => { closeCategory(); history.back(); }}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-3 active:text-gray-800"
          >
            <ChevronLeft size={18} />
            <span>{emojis[activeCategory] ?? "📦"}</span>
            {labels[activeCategory] ?? activeCategory}
          </button>

          <div className="grid grid-cols-3 gap-2.5">
            {categoryProducts.map((product) => (
              <ProductGridTile
                key={product.id}
                product={product}
                onEdit={onEdit}
              />
            ))}
            <button
              onClick={() => onAdd(activeCategory!)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-3 gap-1 aspect-square text-gray-400 active:bg-gray-50"
            >
              <Plus size={24} />
              <span className="text-[11px] font-medium">Añadir</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ProductGridTile({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: (p: Product) => void;
}) {
  const [, startTransition] = useTransition();
  const [units, setUnits] = useState(product.units);
  const [pendingDelete, setPendingDelete] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (product.units !== units && !pendingDelete) {
    setUnits(product.units);
  }

  function handleUnit(delta: number) {
    const next = Math.max(0, units + delta);
    setUnits(next);
    startTransition(() => updateUnits(product.id, delta));
  }

  function handleDeleteTap() {
    if (pendingDelete) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      startTransition(() => deleteProduct(product.id));
    } else {
      setPendingDelete(true);
      resetTimer.current = setTimeout(() => setPendingDelete(false), 2000);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border-2 p-3 gap-1 relative",
        units === 0
          ? "border-red-200 bg-red-50/50"
          : "border-gray-200 bg-white"
      )}
    >
      {product.priority > 0 && (
        <span className={cn(
          "absolute top-1.5 left-1.5 text-[9px] font-bold",
          PRIORITY_COLORS[product.priority]
        )}>
          {PRIORITY_ICONS[product.priority]}
        </span>
      )}
      <div className="absolute top-1 right-1 flex">
        <button
          onClick={() => onEdit(product)}
          className="w-7 h-7 flex items-center justify-center text-gray-300 active:text-gray-600"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={handleDeleteTap}
          className={cn(
            "w-7 h-7 flex items-center justify-center transition-colors",
            pendingDelete ? "text-red-500" : "text-gray-300 active:text-red-500"
          )}
        >
          <Trash2 size={12} strokeWidth={pendingDelete ? 2.5 : 1.8} />
        </button>
      </div>

      <span className="text-2xl leading-none mt-2">
        {product.icon || "📦"}
      </span>

      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight line-clamp-2 w-full">
        {product.name}
      </span>

      <div className="flex items-center gap-1.5 mt-1">
        <button
          onClick={() => handleUnit(-1)}
          disabled={units === 0}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full border text-sm font-semibold",
            units === 0
              ? "border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 active:bg-gray-100"
          )}
        >
          <Minus size={12} />
        </button>
        <span
          className={cn(
            "w-6 text-center text-sm font-bold tabular-nums",
            units === 0 ? "text-red-500" : "text-gray-900"
          )}
        >
          {units}
        </span>
        <button
          onClick={() => handleUnit(1)}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-sm font-semibold text-gray-700 active:bg-gray-100"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
