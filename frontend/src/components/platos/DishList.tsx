"use client";

import { useState, useCallback } from "react";
import { Plus, ChevronDown, Grid3X3, List } from "lucide-react";
import type { Product, Category } from "@prisma/client";
import { DISH_TYPE_LABELS, DISH_TYPE_EMOJIS, DISH_TYPE_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useModalHistory } from "@/lib/useModalHistory";
import DishCard, { type DishFull } from "./DishCard";
import DishDetailSheet from "./DishDetailSheet";
import DishForm from "./DishForm";
import type { DishType } from "@prisma/client";

interface DishListProps {
  dishes: DishFull[];
  products: Product[];
  categories: Category[];
}

export default function DishList({ dishes, products, categories }: DishListProps) {
  const [formDish, setFormDish] = useState<DishFull | null | undefined>(undefined);
  const [formType, setFormType] = useState<DishType | undefined>(undefined);
  const [detailDish, setDetailDish] = useState<DishFull | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("grid");

  const dismissDetail = useCallback(() => setDetailDish(null), []);
  const closeDetail = useModalHistory(detailDish !== null, dismissDetail);

  const dismissForm = useCallback(() => { setFormDish(undefined); setFormType(undefined); }, []);
  const closeForm = useModalHistory(formDish !== undefined, dismissForm);

  function toggleSection(section: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  }

  function openNewDish(type?: DishType) {
    setFormType(type);
    setFormDish(null);
  }

  const grouped = DISH_TYPE_ORDER.map((type) => ({
    type,
    label: DISH_TYPE_LABELS[type],
    emoji: DISH_TYPE_EMOJIS[type],
    dishes: dishes.filter((d) => d.type === type),
  })).filter((g) => g.dishes.length > 0);

  const isEmpty = dishes.length === 0;

  // Availability helper for grid cards
  function isDishAvailable(dish: DishFull): boolean {
    const required = dish.ingredients.filter((i) => !i.optional);
    if (required.length === 0 && dish.sides.length === 0) return true;
    const standalone = required.filter((i) => !i.group);
    const groups = new Map<string, typeof required>();
    for (const ing of required) {
      if (ing.group) {
        const list = groups.get(ing.group) ?? [];
        list.push(ing);
        groups.set(ing.group, list);
      }
    }
    const standaloneOk = standalone.every((i) => i.product.units >= i.quantity);
    const groupsOk = [...groups.values()].every((members) => {
      const min = members[0]?.groupMin ?? 1;
      return members.filter((i) => i.product.units >= i.quantity).length >= min;
    });
    return standaloneOk && groupsOk;
  }

  return (
    <>
      {/* Header con toggle de vista */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Platos</h1>
        {!isEmpty && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 active:text-gray-600"
              )}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                view === "list" ? "bg-gray-900 text-white" : "text-gray-400 active:text-gray-600"
              )}
            >
              <List size={16} />
            </button>
          </div>
        )}
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-4xl">🍽️</span>
          <p className="text-base">No hay platos todavía</p>
          <button
            onClick={() => openNewDish()}
            className="mt-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <>

          {view === "list" ? (
            /* ── Vista lista ── */
            <div>
              {grouped.map(({ type, label, emoji, dishes: typeDishes }) => {
                const isCollapsed = collapsed.has(type);
                return (
                  <section key={type}>
                    <button
                      onClick={() => toggleSection(type)}
                      className={cn(
                        "w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 active:bg-gray-100",
                        type === "ACOMPANANTE" ? "text-orange-600" : "text-gray-500"
                      )}
                    >
                      <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", isCollapsed && "-rotate-90")} />
                      <span>{emoji}</span>
                      <span className="flex-1 text-left">{label}</span>
                      <span className="text-gray-400 normal-case font-normal tracking-normal">{typeDishes.length}</span>
                    </button>
                    {!isCollapsed && typeDishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} onEdit={(d) => setFormDish(d)} />
                    ))}
                  </section>
                );
              })}
            </div>
          ) : (
            /* ── Vista cuadrícula ── */
            <div className="pb-20">
              {DISH_TYPE_ORDER.map((type) => {
                const typeDishes = dishes.filter((d) => d.type === type);
                const isCollapsed = collapsed.has(type);
                return (
                  <section key={type}>
                    <button
                      onClick={() => toggleSection(type)}
                      className={cn(
                        "w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 active:bg-gray-100",
                        type === "ACOMPANANTE" ? "text-orange-600" : "text-gray-500"
                      )}
                    >
                      <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", isCollapsed && "-rotate-90")} />
                      <span>{DISH_TYPE_EMOJIS[type]}</span>
                      <span className="flex-1 text-left">{DISH_TYPE_LABELS[type]}</span>
                      <span className="text-gray-400 normal-case font-normal tracking-normal">{typeDishes.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="grid grid-cols-3 gap-2.5 p-3">
                        {typeDishes.map((dish) => {
                          const available = isDishAvailable(dish);
                          const hasIngredients = dish.ingredients.length > 0 || dish.sides.length > 0;
                          return (
                            <button
                              key={dish.id}
                              onClick={() => setDetailDish(dish)}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 aspect-square transition-colors",
                                !dish.active
                                  ? "border-gray-200 bg-gray-50 opacity-50"
                                  : "border-gray-200 bg-white active:bg-gray-50"
                              )}
                            >
                              {/* Availability dot */}
                              {hasIngredients && (
                                <span className={cn(
                                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                                  available ? "bg-emerald-400" : "bg-red-400"
                                )} />
                              )}
                              <span className="text-2xl leading-none">{dish.emoji || "🍽️"}</span>
                              <span className={cn(
                                "text-[11px] font-medium text-center leading-tight line-clamp-2",
                                dish.active ? "text-gray-700" : "text-gray-400 line-through"
                              )}>
                                {dish.name}
                              </span>
                            </button>
                          );
                        })}
                        {/* Add new dish card */}
                        <button
                          onClick={() => openNewDish(type)}
                          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 border-dashed border-gray-300 aspect-square text-gray-400 active:bg-gray-50"
                        >
                          <Plus size={20} />
                          <span className="text-[10px] font-medium">Añadir</span>
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {!isEmpty && (
        <button
          onClick={() => openNewDish()}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-emerald-700 transition-colors z-30"
          aria-label="Añadir plato"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {detailDish && (
        <DishDetailSheet
          dish={detailDish}
          onEdit={() => { dismissDetail(); setFormDish(detailDish); }}
          onClose={closeDetail}
        />
      )}

      {formDish !== undefined && (
        <DishForm
          dish={formDish}
          defaultType={formType}
          allDishes={dishes}
          products={products}
          categories={categories}
          onClose={closeForm}
        />
      )}
    </>
  );
}
