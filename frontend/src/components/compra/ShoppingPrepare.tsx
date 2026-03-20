"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
import { ChevronLeft, ShoppingCart, Check, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps, sortByPriority, PRIORITY_ICONS, PRIORITY_COLORS } from "@/lib/constants";
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

  const openCategory = useCallback((slug: string) => {
    setActiveCategory(slug);
    history.pushState({ gridCategory: slug }, "");
  }, []);

  const closeCategory = useCallback(() => {
    setActiveCategory(null);
  }, []);

  useEffect(() => {
    function onPopState(e: PopStateEvent) {
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
      <header className="sticky top-0 md:top-12 bg-surface border-b border-border-default px-4 py-4 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">
          <span className="mr-1.5">🛒</span>{isAdding ? "Añadir productos" : "Preparar compra"}
        </h1>
        {totalNew > 0 && (
          <span className="text-xs font-medium text-accent-text bg-accent-soft px-2.5 py-1 rounded-full">
            {totalNew} {totalNew === 1 ? "nuevo" : "nuevos"}
          </span>
        )}
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-faint gap-3">
          <span className="text-4xl">📦</span>
          <p className="text-base">No hay productos en el inventario</p>
          <p className="text-sm">Añade productos desde Inventario</p>
        </div>
      ) : (
        <div className="p-4">
          {!activeCategory ? (
            /* ── Category grid ── */
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-2">
              {categoriesWithProducts.map((slug) => {
                const catProducts = products.filter((p) => p.category === slug);
                const total = catProducts.length;
                const selectedInCat = catProducts.filter(
                  (p) => selected.has(p.id) || existingProductIds?.has(p.id)
                ).length;
                return (
                  <button
                    key={slug}
                    onClick={() => openCategory(slug)}
                    className="relative flex flex-col items-center justify-center gap-1.5 p-4 md:p-2.5 rounded-2xl md:rounded-xl bg-surface-alt border border-border-default active:bg-pressed hover:bg-pressed aspect-square"
                  >
                    {selectedInCat > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-accent text-inverted text-[10px] font-bold rounded-full flex items-center justify-center">
                        {selectedInCat}
                      </span>
                    )}
                    <span className="text-3xl md:text-2xl">{emojis[slug] ?? "📦"}</span>
                    <span className="text-xs font-medium text-secondary text-center leading-tight">
                      {labels[slug] ?? slug}
                    </span>
                    <span className="text-[10px] text-faint">{total}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Product grid within category ── */
            <>
              <button
                onClick={() => { closeCategory(); history.back(); }}
                className="flex items-center gap-1 text-sm font-medium text-tertiary mb-3 active:text-primary"
              >
                <ChevronLeft size={18} />
                <span>{emojis[activeCategory] ?? "📦"}</span>
                {labels[activeCategory] ?? activeCategory}
              </button>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-2">
                {categoryProducts.map((product) => {
                  const inSession = existingProductIds?.has(product.id) ?? false;
                  const isSelected = selected.has(product.id) || inSession;
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-2xl md:rounded-xl border-2 p-3 md:p-2 gap-1 aspect-square transition-colors",
                        isSelected
                          ? "border-accent bg-accent-soft"
                          : product.units === 0
                            ? "border-danger-border bg-danger-soft/50 active:bg-danger-soft"
                            : "border-border-default bg-surface active:bg-surface-alt"
                      )}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent text-inverted rounded-full flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}

                      {/* Priority / "en lista" indicator */}
                      {inSession ? (
                        <span className="absolute top-1.5 left-1.5 text-[8px] text-accent-text font-bold uppercase">
                          lista
                        </span>
                      ) : product.priority > 0 && (
                        <span className={cn(
                          "absolute top-2 left-2 text-[14px] font-bold",
                          PRIORITY_COLORS[product.priority]
                        )}>
                          {PRIORITY_ICONS[product.priority]}
                        </span>
                      )}

                      <span className="text-2xl md:text-xl leading-none mt-1">
                        {product.icon || "📦"}
                      </span>

                      <span className={cn(
                        "text-[11px] font-medium text-center leading-tight line-clamp-2 w-full",
                        isSelected ? "text-accent-text" : "text-secondary"
                      )}>
                        {product.name}
                      </span>

                      <span className={cn(
                        "text-[10px]",
                        product.units === 0 ? "text-danger-text" : "text-faint"
                      )}>
                        {product.units} uds
                      </span>
                    </button>
                  );
                })}
                {/* Back card */}
                <button
                  onClick={() => { closeCategory(); history.back(); }}
                  className="flex flex-col items-center justify-center rounded-2xl md:rounded-xl border-2 border-dashed border-border-strong p-3 md:p-2 gap-1 aspect-square text-faint active:bg-surface-alt hover:bg-surface-alt"
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
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-surface via-surface to-surface/0 z-30">
          <div className="flex gap-3">
            {isAdding && (
              <button
                onClick={onBack}
                className="h-14 px-5 rounded-2xl border border-border-default text-tertiary font-medium text-base active:bg-surface-alt"
              >
                Volver
              </button>
            )}
            {totalNew > 0 && (
              <button
                onClick={handleStart}
                disabled={isPending}
                className={cn(
                  "flex-1 h-14 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-inverted font-semibold text-base transition-colors",
                  isPending ? "bg-accent/70" : "bg-accent active:bg-accent-hover"
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
