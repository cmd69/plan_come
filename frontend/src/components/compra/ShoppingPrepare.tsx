"use client";

import { useState, useMemo, useTransition } from "react";
import { ChevronLeft, ShoppingCart, Check, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";
import { createSession, addItemsToSession } from "@/actions/shopping";

interface ShoppingPrepareProps {
  products: Product[];
  categories: Category[];
  /** If set, we're adding to an existing session */
  sessionId?: number;
  /** Products already in the session (to show as pre-selected) */
  existingProductIds?: Set<number>;
  onBack?: () => void;
}

export default function ShoppingPrepare({
  products,
  categories,
  sessionId,
  existingProductIds,
  onBack,
}: ShoppingPrepareProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  const categoriesWithProducts = order.filter((slug) =>
    products.some((p) => p.category === slug)
  );

  const categoryProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : [];

  function toggleProduct(productId: number) {
    // Don't allow deselecting products already in the session
    if (existingProductIds?.has(productId)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  }

  function handleStart() {
    const ids = [...selected];
    if (ids.length === 0) return;

    startTransition(async () => {
      if (sessionId) {
        await addItemsToSession(sessionId, ids);
      } else {
        await createSession(ids);
      }
    });
  }

  const isAdding = !!sessionId;
  const totalNew = selected.size;

  return (
    <>
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isAdding ? "Añadir productos" : "Preparar compra"}
        </h1>
        {totalNew > 0 && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {totalNew} {totalNew === 1 ? "nuevo" : "nuevos"}
          </span>
        )}
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-4xl">📦</span>
          <p className="text-base">No hay productos en el inventario</p>
          <p className="text-sm">Añade productos desde Inventario</p>
        </div>
      ) : (
        <div className="p-4">
          {!activeCategory ? (
            /* ── Category grid ── */
            <div className="grid grid-cols-3 gap-3">
              {categoriesWithProducts.map((slug) => {
                const catProducts = products.filter((p) => p.category === slug);
                const total = catProducts.length;
                const selectedInCat = catProducts.filter(
                  (p) => selected.has(p.id) || existingProductIds?.has(p.id)
                ).length;
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveCategory(slug)}
                    className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 active:bg-gray-100 aspect-square"
                  >
                    {selectedInCat > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {selectedInCat}
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
            /* ── Product grid within category ── */
            <>
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-3 active:text-gray-800"
              >
                <ChevronLeft size={18} />
                <span>{emojis[activeCategory] ?? "📦"}</span>
                {labels[activeCategory] ?? activeCategory}
              </button>

              <div className="grid grid-cols-3 gap-2.5">
                {categoryProducts.map((product) => {
                  const inSession = existingProductIds?.has(product.id) ?? false;
                  const isSelected = selected.has(product.id) || inSession;
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 gap-1 aspect-square transition-colors",
                        isSelected
                          ? "border-emerald-400 bg-emerald-50"
                          : product.units === 0
                            ? "border-red-200 bg-red-50/50 active:bg-red-50"
                            : "border-gray-200 bg-white active:bg-gray-50"
                      )}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}

                      {/* "en lista" label for existing session items */}
                      {inSession && (
                        <span className="absolute top-1.5 left-1.5 text-[8px] text-emerald-500 font-bold uppercase">
                          lista
                        </span>
                      )}

                      <span className="text-2xl leading-none mt-1">
                        {product.icon || "📦"}
                      </span>

                      <span className={cn(
                        "text-[11px] font-medium text-center leading-tight line-clamp-2 w-full",
                        isSelected ? "text-emerald-800" : "text-gray-700"
                      )}>
                        {product.name}
                      </span>

                      <span className={cn(
                        "text-[10px]",
                        product.units === 0 ? "text-red-400" : "text-gray-400"
                      )}>
                        {product.units} uds
                      </span>
                    </button>
                  );
                })}
                {/* Back card */}
                <button
                  onClick={() => setActiveCategory(null)}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-3 gap-1 aspect-square text-gray-400 active:bg-gray-50"
                >
                  <Undo2 size={22} />
                  <span className="text-[11px] font-medium">Volver</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom bar */}
      {(totalNew > 0 || isAdding) && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-white/0 z-30">
          <div className="flex gap-3">
            {isAdding && (
              <button
                onClick={onBack}
                className="h-14 px-5 rounded-2xl border border-gray-200 text-gray-600 font-medium text-base active:bg-gray-50"
              >
                Volver
              </button>
            )}
            {totalNew > 0 && (
              <button
                onClick={handleStart}
                disabled={isPending}
                className={cn(
                  "flex-1 h-14 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-white font-semibold text-base transition-colors",
                  isPending ? "bg-emerald-400" : "bg-emerald-600 active:bg-emerald-700"
                )}
              >
                <ShoppingCart size={20} />
                {isPending
                  ? "Creando…"
                  : isAdding
                    ? `Añadir ${totalNew} a la lista`
                    : `Ir a comprar (${totalNew})`
                }
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
