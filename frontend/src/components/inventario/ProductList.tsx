"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@prisma/client";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_EMOJIS, PRODUCT_CATEGORY_ORDER } from "@/lib/constants";
import ProductCard from "./ProductCard";
import ProductForm from "./ProductForm";

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const [formProduct, setFormProduct] = useState<Product | null | undefined>(
    undefined // undefined = cerrado; null = nuevo; Product = editar
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleSection(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  const grouped = PRODUCT_CATEGORY_ORDER.map((category) => ({
    category,
    label: PRODUCT_CATEGORY_LABELS[category],
    emoji: PRODUCT_CATEGORY_EMOJIS[category],
    products: products.filter((p) => p.category === category),
  })).filter((g) => g.products.length > 0);

  const isEmpty = products.length === 0;

  return (
    <>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-4xl">📦</span>
          <p className="text-base">No hay productos todavía</p>
          <button
            onClick={() => setFormProduct(null)}
            className="mt-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div>
          {grouped.map(({ category, label, emoji, products: groupProducts }) => {
            const isCollapsed = collapsed.has(category);
            return (
              <section key={category}>
                <button
                  onClick={() => toggleSection(category)}
                  className="w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 active:bg-gray-100"
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
          onClose={() => setFormProduct(undefined)}
        />
      )}
    </>
  );
}
