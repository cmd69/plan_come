"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import type { Product, Category } from "@prisma/client";
import { DISH_CATEGORY_LABELS, DISH_CATEGORY_EMOJIS, DISH_CATEGORY_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import DishCard, { type DishFull } from "./DishCard";
import DishForm from "./DishForm";

interface DishListProps {
  dishes: DishFull[];
  products: Product[];
  categories: Category[];
}

export default function DishList({ dishes, products, categories }: DishListProps) {
  const [formDish, setFormDish] = useState<DishFull | null | undefined>(undefined);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleSection(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  const mainDishes = dishes.filter((d) => !d.isSide);
  const sideDishes = dishes.filter((d) => d.isSide);

  const grouped = DISH_CATEGORY_ORDER.map((category) => ({
    category,
    label: DISH_CATEGORY_LABELS[category],
    emoji: DISH_CATEGORY_EMOJIS[category],
    dishes: mainDishes.filter((d) => d.category === category),
  })).filter((g) => g.dishes.length > 0);

  const isEmpty = dishes.length === 0;

  return (
    <>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-4xl">🍽️</span>
          <p className="text-base">No hay platos todavía</p>
          <button
            onClick={() => setFormDish(null)}
            className="mt-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div>
          {grouped.map(({ category, label, emoji, dishes: groupDishes }) => {
            const isCollapsed = collapsed.has(category);
            return (
              <section key={category}>
                <button
                  onClick={() => toggleSection(category)}
                  className="w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 active:bg-gray-100"
                >
                  <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", isCollapsed && "-rotate-90")} />
                  <span>{emoji}</span>
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-gray-400 normal-case font-normal tracking-normal">{groupDishes.length}</span>
                </button>
                {!isCollapsed && groupDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} onEdit={(d) => setFormDish(d)} />
                ))}
              </section>
            );
          })}
          {/* Acompañantes */}
          {sideDishes.length > 0 && (
            <section>
              <button
                onClick={() => toggleSection("__sides__")}
                className="w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 border-b border-orange-100 flex items-center gap-1.5 active:bg-orange-100"
              >
                <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", collapsed.has("__sides__") && "-rotate-90")} />
                <span>🍽️</span>
                <span className="flex-1 text-left">Acompañantes</span>
                <span className="text-orange-400 normal-case font-normal tracking-normal">{sideDishes.length}</span>
              </button>
              {!collapsed.has("__sides__") && sideDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} onEdit={(d) => setFormDish(d)} />
              ))}
            </section>
          )}
        </div>
      )}

      {!isEmpty && (
        <button
          onClick={() => setFormDish(null)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-emerald-700 transition-colors z-30"
          aria-label="Añadir plato"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {formDish !== undefined && (
        <DishForm dish={formDish} allDishes={dishes} products={products} categories={categories} onClose={() => setFormDish(undefined)} />
      )}
    </>
  );
}
