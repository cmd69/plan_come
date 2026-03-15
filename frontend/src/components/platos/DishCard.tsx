"use client";

import { useState, useRef, useTransition } from "react";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { toggleDishActive, deleteDish } from "@/actions/dishes";
import { DISH_CATEGORY_LABELS, DISH_CATEGORY_EMOJIS } from "@/lib/constants";
import type { Dish, DishIngredient, Product } from "@prisma/client";
import { cn } from "@/lib/utils";

type DishIngredientWithProduct = DishIngredient & { product: Product };
export type DishFull = Dish & { ingredients: DishIngredientWithProduct[] };

interface DishCardProps {
  dish: DishFull;
  onEdit: (dish: DishFull) => void;
}

export default function DishCard({ dish, onEdit }: DishCardProps) {
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const required = dish.ingredients.filter((i) => !i.optional);
  const optional = dish.ingredients.filter((i) => i.optional);
  const hasStock = required.every((i) => i.product.units >= i.quantity);
  const hasIngredients = dish.ingredients.length > 0;

  function handleDeleteTap() {
    if (pendingDelete) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      startTransition(async () => { await deleteDish(dish.id); });
    } else {
      setPendingDelete(true);
      resetTimer.current = setTimeout(() => setPendingDelete(false), 2000);
    }
  }

  function handleToggleActive() {
    startTransition(async () => { await toggleDishActive(dish.id, !dish.active); });
  }

  return (
    <div className={cn("bg-white border-b border-gray-100", !dish.active && "opacity-50")}>
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Emoji categoría */}
        <span className="text-xl shrink-0">{DISH_CATEGORY_EMOJIS[dish.category]}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-base font-medium text-gray-900 truncate", !dish.active && "line-through")}>
            {dish.name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">{DISH_CATEGORY_LABELS[dish.category]}</span>
            {hasIngredients && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <span className={cn("text-xs font-medium", hasStock ? "text-emerald-600" : "text-red-400")}>
                  {hasStock ? "Disponible" : "Sin stock"}
                </span>
              </>
            )}
            {dish.notes && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400 italic truncate max-w-[120px]">{dish.notes}</span>
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          {hasIngredients && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 flex items-center justify-center text-gray-400"
              aria-label="Ver ingredientes"
            >
              <ChevronDown size={16} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
            </button>
          )}
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
          <button onClick={() => onEdit(dish)} className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-gray-700">
            <Pencil size={17} />
          </button>
          <button
            onClick={handleDeleteTap}
            className={cn("w-10 h-10 flex items-center justify-center transition-colors", pendingDelete ? "text-red-500" : "text-gray-400 active:text-red-500")}
          >
            <Trash2 size={17} strokeWidth={pendingDelete ? 2.5 : 1.8} />
          </button>
        </div>
      </div>

      {/* Detalle ingredientes (expandible) */}
      {expanded && hasIngredients && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {required.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {required.map((ing) => (
                <span
                  key={ing.id}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    ing.product.units >= ing.quantity
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {ing.product.icon && `${ing.product.icon} `}
                  {ing.product.name} ×{ing.quantity}
                  {ing.product.units < ing.quantity && " ⚠"}
                </span>
              ))}
            </div>
          )}
          {optional.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {optional.map((ing) => (
                <span
                  key={ing.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium"
                >
                  {ing.product.icon && `${ing.product.icon} `}
                  {ing.product.name} ×{ing.quantity}
                  <span className="opacity-60"> opc</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
