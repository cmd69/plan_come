"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dish, MealType } from "@prisma/client";
import { DISH_TYPE_LABELS, DISH_TYPE_EMOJIS } from "@/lib/constants";

interface SlotPickerProps {
  dishes: Dish[];
  meal: MealType;
  onSelect: (dishId: number | null) => void;
  onClose: () => void;
}

export default function SlotPicker({ dishes, meal, onSelect, onClose }: SlotPickerProps) {
  const [search, setSearch] = useState("");

  // Show dishes that match this meal: COMIDA+MIXTO for lunch, CENA+MIXTO for dinner
  const mainDishes = dishes.filter((d) =>
    d.type === "MIXTO" || d.type === meal
  );
  const filtered = search.trim()
    ? mainDishes.filter((d) =>
        d.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : mainDishes;

  // Group by type: show specific type first, then MIXTO
  const typeOrder = meal === "COMIDA"
    ? (["COMIDA", "MIXTO"] as const)
    : (["CENA", "MIXTO"] as const);

  const grouped = typeOrder.map((type) => ({
    type,
    label: DISH_TYPE_LABELS[type],
    emoji: DISH_TYPE_EMOJIS[type],
    dishes: filtered.filter((d) => d.type === type),
  })).filter((g) => g.dishes.length > 0);

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-[70]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[80] max-h-[80vh] flex flex-col sheet-popup">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-primary">Elegir plato</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-faint"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-pressed">
            <Search size={16} className="text-faint shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plato..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
          </div>
        </div>

        {/* Clear option */}
        <div className="px-4 pb-2">
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted bg-surface-alt active:bg-pressed"
          >
            Dejar vacío
          </button>
        </div>

        {/* Dish list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {grouped.length === 0 ? (
            <p className="text-sm text-faint text-center py-8">
              No se encontraron platos
            </p>
          ) : (
            grouped.map(({ type, label, emoji, dishes: typeDishes }) => (
              <div key={type} className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                  <span>{emoji}</span> {label}
                </p>
                {typeDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => onSelect(dish.id)}
                    className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-primary active:bg-accent-soft active:text-accent-text flex items-center gap-2"
                  >
                    <span>{dish.emoji || "🍽️"}</span>
                    <span className="flex-1">{dish.name}</span>
                    {!dish.active && (
                      <span className="text-[10px] text-faint bg-pressed px-1.5 py-0.5 rounded-full">
                        inactivo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
