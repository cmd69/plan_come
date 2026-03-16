"use client";

import { useState, useMemo } from "react";
import { X, ChevronLeft, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";

interface IngredientPickerProps {
  products: Product[];
  categories: Category[];
  selectedIds: Set<number>;
  excludeIds?: Set<number>;
  onConfirm: (productIds: number[]) => void;
  onClose: () => void;
  accentColor?: { border: string; bg: string; text: string; check: string };
  title?: string;
}

export default function IngredientPicker({
  products,
  categories,
  selectedIds,
  excludeIds,
  onConfirm,
  onClose,
  accentColor,
  title = "Ingredientes",
}: IngredientPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [local, setLocal] = useState<Set<number>>(new Set(selectedIds));

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  // Filter out excluded products
  const availableProducts = excludeIds
    ? products.filter((p) => !excludeIds.has(p.id))
    : products;

  function toggleProduct(id: number) {
    setLocal((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...local]);
    onClose();
  }

  const categoriesWithProducts = order.filter((slug) =>
    availableProducts.some((p) => p.category === slug)
  );

  const categoryProducts = activeCategory
    ? availableProducts.filter((p) => p.category === activeCategory)
    : [];

  const accent = accentColor ?? {
    border: "border-accent",
    bg: "bg-accent-soft",
    text: "text-accent-text",
    check: "bg-accent",
  };

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-[70]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-elevated rounded-t-2xl z-[80] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="w-8 h-8 flex items-center justify-center text-muted active:text-secondary"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-primary">
              {activeCategory
                ? `${emojis[activeCategory] ?? "📦"} ${labels[activeCategory] ?? activeCategory}`
                : title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-faint"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeCategory ? (
            <div className="grid grid-cols-3 gap-3">
              {categoriesWithProducts.map((slug) => {
                const catProducts = availableProducts.filter((p) => p.category === slug);
                const catSelected = catProducts.filter((p) => local.has(p.id)).length;
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveCategory(slug)}
                    className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-surface-alt border border-border-default active:bg-pressed aspect-square"
                  >
                    <span className="text-3xl">{emojis[slug] ?? "📦"}</span>
                    <span className="text-xs font-medium text-secondary text-center leading-tight">
                      {labels[slug] ?? slug}
                    </span>
                    {catSelected > 0 && (
                      <span className={cn("absolute top-2 right-2 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center", accent.check)}>
                        {catSelected}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {categoryProducts.map((product) => {
                const sel = local.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 aspect-square transition-colors",
                      sel
                        ? `${accent.border} ${accent.bg}`
                        : "border-border-default bg-surface active:bg-surface-alt"
                    )}
                  >
                    {sel && (
                      <span className={cn("absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center", accent.check)}>
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-2xl leading-none">
                      {product.icon || "📦"}
                    </span>
                    <span className={cn(
                      "text-[11px] font-medium text-center leading-tight line-clamp-2",
                      sel ? "text-primary" : "text-tertiary"
                    )}>
                      {product.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border-subtle px-4 py-3 flex items-center gap-3">
          <div className="flex-1 text-sm text-muted">
            <span className="font-semibold text-secondary">{local.size}</span> seleccionados
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "px-5 py-2.5 text-white text-sm font-semibold rounded-xl",
              accent.check, "active:opacity-80"
            )}
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}
