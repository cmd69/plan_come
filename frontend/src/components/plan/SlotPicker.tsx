"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dish } from "@prisma/client";
import {
  DISH_CATEGORY_LABELS,
  DISH_CATEGORY_EMOJIS,
  DISH_CATEGORY_ORDER,
} from "@/lib/constants";

interface SlotPickerProps {
  dishes: Dish[];
  onSelect: (dishId: number | null) => void;
  onClose: () => void;
}

export default function SlotPicker({ dishes, onSelect, onClose }: SlotPickerProps) {
  const [search, setSearch] = useState("");

  // Only show main dishes (not sides) in slot picker
  const mainDishes = dishes.filter((d) => !d.isSide);
  const filtered = search.trim()
    ? mainDishes.filter((d) =>
        d.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : mainDishes;

  const grouped = DISH_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: DISH_CATEGORY_LABELS[cat],
    emoji: DISH_CATEGORY_EMOJIS[cat],
    dishes: filtered.filter((d) => d.category === cat),
  })).filter((g) => g.dishes.length > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[70]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Elegir plato</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-gray-100">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plato..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Clear option */}
        <div className="px-4 pb-2">
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-50 active:bg-gray-100"
          >
            Dejar vacío
          </button>
        </div>

        {/* Dish list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {grouped.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No se encontraron platos
            </p>
          ) : (
            grouped.map(({ category, label, emoji, dishes: catDishes }) => (
              <div key={category} className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                  <span>{emoji}</span> {label}
                </p>
                {catDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => onSelect(dish.id)}
                    className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-gray-800 active:bg-emerald-50 active:text-emerald-700 flex items-center gap-2"
                  >
                    <span>{emoji}</span>
                    <span className="flex-1">{dish.name}</span>
                    {!dish.active && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
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
