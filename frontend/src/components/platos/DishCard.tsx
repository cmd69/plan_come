"use client";

import { useState, useRef, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toggleDishActive, deleteDish } from "@/actions/dishes";
import { DISH_CATEGORY_LABELS, DISH_CATEGORY_EMOJIS } from "@/lib/constants";
import type { Dish, Product } from "@prisma/client";
import { cn } from "@/lib/utils";

type DishWithProduct = Dish & { mainProduct: Product | null };

interface DishCardProps {
  dish: DishWithProduct;
  onEdit: (dish: DishWithProduct) => void;
}

export default function DishCard({ dish, onEdit }: DishCardProps) {
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteTap() {
    if (pendingDelete) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      startTransition(async () => {
        await deleteDish(dish.id);
      });
    } else {
      setPendingDelete(true);
      resetTimer.current = setTimeout(() => setPendingDelete(false), 2000);
    }
  }

  function handleToggleActive() {
    startTransition(async () => {
      await toggleDishActive(dish.id, !dish.active);
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 transition-opacity",
        !dish.active && "opacity-50"
      )}
    >
      {/* Categoría emoji */}
      <span className="text-xl shrink-0">
        {DISH_CATEGORY_EMOJIS[dish.category]}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-base font-medium text-gray-900 truncate", !dish.active && "line-through")}>
          {dish.name}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {DISH_CATEGORY_LABELS[dish.category]}
          {dish.mainProduct && (
            <>
              {" · "}
              <span className={cn(dish.mainProduct.units === 0 && "text-red-400")}>
                {dish.mainProduct.icon && `${dish.mainProduct.icon} `}
                {dish.mainProduct.name}
                {dish.mainProduct.units === 0 && " (sin stock)"}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Toggle activo */}
        <button
          onClick={handleToggleActive}
          className={cn(
            "h-7 px-2.5 rounded-full text-xs font-semibold transition-colors",
            dish.active
              ? "bg-emerald-100 text-emerald-700 active:bg-emerald-200"
              : "bg-gray-100 text-gray-500 active:bg-gray-200"
          )}
        >
          {dish.active ? "Activo" : "Inactivo"}
        </button>

        <button
          onClick={() => onEdit(dish)}
          className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-gray-700"
          aria-label="Editar"
        >
          <Pencil size={17} />
        </button>

        <button
          onClick={handleDeleteTap}
          className={cn(
            "w-10 h-10 flex items-center justify-center transition-colors",
            pendingDelete ? "text-red-500" : "text-gray-400 active:text-red-500"
          )}
          aria-label={pendingDelete ? "Confirmar eliminación" : "Eliminar"}
        >
          <Trash2 size={17} strokeWidth={pendingDelete ? 2.5 : 1.8} />
        </button>
      </div>
    </div>
  );
}
