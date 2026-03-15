"use client";

import { useState, useMemo } from "react";
import { X, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";
import type { IngredientInput } from "@/actions/dishes";

interface IngredientPickerProps {
  products: Product[];
  categories: Category[];
  selected: IngredientInput[];
  onChange: (ingredients: IngredientInput[]) => void;
  onClose: () => void;
}

export default function IngredientPicker({
  products,
  categories,
  selected,
  onChange,
  onClose,
}: IngredientPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [local, setLocal] = useState<IngredientInput[]>([...selected]);

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  const selectedIds = new Set(local.map((i) => i.productId));

  function toggleProduct(product: Product) {
    setLocal((prev) => {
      const exists = prev.find((i) => i.productId === product.id);
      if (exists) {
        return prev.filter((i) => i.productId !== product.id);
      }
      return [...prev, { productId: product.id, quantity: 1, optional: false, group: null }];
    });
  }

  function toggleOptional(productId: number) {
    setLocal((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, optional: !i.optional } : i
      )
    );
  }

  function isSelected(productId: number) {
    return selectedIds.has(productId);
  }

  function isOptional(productId: number) {
    return local.find((i) => i.productId === productId)?.optional ?? false;
  }

  function handleConfirm() {
    onChange(local);
    onClose();
  }

  const categoriesWithProducts = order.filter((slug) =>
    products.some((p) => p.category === slug)
  );

  const categoryProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : [];

  const totalSelected = local.length;
  const totalOptional = local.filter((i) => i.optional).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[70]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 active:text-gray-700"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {activeCategory
                ? `${emojis[activeCategory] ?? "📦"} ${labels[activeCategory] ?? activeCategory}`
                : "Ingredientes"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeCategory ? (
            <div className="grid grid-cols-3 gap-3">
              {categoriesWithProducts.map((slug) => {
                const catProducts = products.filter((p) => p.category === slug);
                const catSelected = local.filter((i) =>
                  catProducts.some((p) => p.id === i.productId)
                ).length;
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveCategory(slug)}
                    className="relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 active:bg-gray-100 aspect-square"
                  >
                    <span className="text-3xl">
                      {emojis[slug] ?? "📦"}
                    </span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {labels[slug] ?? slug}
                    </span>
                    {catSelected > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {catSelected}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  Obligatorio
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
                  Opcional
                </span>
                <span className="text-gray-400 ml-auto">
                  Pulsa largo = opcional
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {categoryProducts.map((product) => {
                  const sel = isSelected(product.id);
                  const opt = isOptional(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!sel) {
                          setLocal((prev) => [
                            ...prev,
                            {
                              productId: product.id,
                              quantity: 1,
                              optional: true,
                              group: null,
                            },
                          ]);
                        } else {
                          toggleOptional(product.id);
                        }
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 aspect-square transition-colors",
                        sel && !opt &&
                          "border-emerald-500 bg-emerald-50",
                        sel && opt &&
                          "border-amber-400 bg-amber-50",
                        !sel &&
                          "border-gray-200 bg-white active:bg-gray-50"
                      )}
                    >
                      {sel && (
                        <span
                          className={cn(
                            "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center",
                            opt ? "bg-amber-400" : "bg-emerald-500"
                          )}
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                      <span className="text-2xl leading-none">
                        {product.icon || "📦"}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-medium text-center leading-tight line-clamp-2",
                          sel ? "text-gray-900" : "text-gray-600"
                        )}
                      >
                        {product.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 text-sm text-gray-500">
            {totalSelected > 0 ? (
              <>
                <span className="font-semibold text-gray-700">
                  {totalSelected}
                </span>{" "}
                seleccionados
                {totalOptional > 0 && (
                  <span className="text-amber-600">
                    {" "}
                    ({totalOptional} opc.)
                  </span>
                )}
              </>
            ) : (
              "Ninguno seleccionado"
            )}
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}
