"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { toggleDishActive, deleteDish } from "@/actions/dishes";
import { DISH_TYPE_LABELS } from "@/lib/constants";
import type { Dish, DishIngredient, DishSide, Product } from "@prisma/client";
import { cn } from "@/lib/utils";

type DishIngredientWithProduct = DishIngredient & { product: Product };
type DishSideWithDish = DishSide & {
  side: Dish & { ingredients: DishIngredientWithProduct[] };
};
export type DishFull = Dish & {
  ingredients: DishIngredientWithProduct[];
  sides: DishSideWithDish[];
};

interface DishCardProps {
  dish: DishFull;
  onEdit: (dish: DishFull) => void;
}

export default function DishCard({ dish, onEdit }: DishCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const required = dish.ingredients.filter((i) => !i.optional);
  const optional = dish.ingredients.filter((i) => i.optional);
  const hasIngredients = dish.ingredients.length > 0;
  const hasSides = dish.sides.length > 0;
  const hasExpandable = hasIngredients || hasSides;

  // Availability: standalone required must all have stock,
  // for each group at least groupMin members must have stock
  const standalone = required.filter((i) => !i.group);
  const groups = new Map<string, DishIngredientWithProduct[]>();
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
    const available = members.filter((i) => i.product.units >= i.quantity).length;
    return available >= min;
  });

  // Side availability
  const sideGroups = new Map<string, DishSideWithDish[]>();
  for (const s of dish.sides) {
    const g = s.group ?? "A";
    const list = sideGroups.get(g) ?? [];
    list.push(s);
    sideGroups.set(g, list);
  }

  function isSideAvailable(side: DishSideWithDish["side"]): boolean {
    const req = side.ingredients.filter((i) => !i.optional);
    if (req.length === 0) return true;
    const sa = req.filter((i) => !i.group);
    const gr = new Map<string, typeof req>();
    for (const ing of req) {
      if (ing.group) {
        const l = gr.get(ing.group) ?? [];
        l.push(ing);
        gr.set(ing.group, l);
      }
    }
    return (
      sa.every((i) => i.product.units >= i.quantity) &&
      [...gr.values()].every((m) => m.some((i) => i.product.units >= i.quantity))
    );
  }

  const sideGroupsOk = [...sideGroups.values()].every((members) => {
    const min = members[0]?.groupMin ?? 1;
    const available = members.filter((s) => isSideAvailable(s.side)).length;
    return available >= min;
  });
  const hasStock = standaloneOk && groupsOk && sideGroupsOk;

  const GROUP_COLORS: Record<string, string> = {
    A: "bg-blue-50 text-blue-700",
    B: "bg-violet-50 text-violet-700",
    C: "bg-teal-50 text-teal-700",
    D: "bg-cyan-50 text-cyan-700",
    E: "bg-rose-50 text-rose-700",
    F: "bg-amber-50 text-amber-700",
  };

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

  const dishEmoji = dish.emoji || "🍽️";

  return (
    <div className={cn("bg-white border-b border-gray-100", !dish.active && "opacity-50")}>
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Emoji del plato */}
        <span className="text-xl shrink-0">{dishEmoji}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-base font-medium text-gray-900 truncate", !dish.active && "line-through")}>
            {dish.name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">{DISH_TYPE_LABELS[dish.type]}</span>
            {hasExpandable && (
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
          {hasExpandable && (
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
      {expanded && hasExpandable && (
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          {/* Standalone required */}
          {standalone.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {standalone.map((ing) => {
                const ok = ing.product.units >= ing.quantity;
                return (
                  <button
                    key={ing.id}
                    onClick={() => router.push(`/inventario?cat=${ing.product.category}`)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    )}
                  >
                    {ing.product.icon && `${ing.product.icon} `}
                    {ing.product.name}{" "}
                    <span className="opacity-70">×{ing.quantity}/{ing.product.units}</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Grouped alternatives */}
          {[...groups.entries()].map(([groupName, members]) => (
            <div key={groupName} className="flex flex-wrap items-center gap-1.5">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", GROUP_COLORS[groupName] ?? "bg-gray-100 text-gray-600")}>
                {members[0]?.groupMin ?? 1}/{members.length}
              </span>
              {members.map((ing) => {
                const ok = ing.product.units >= ing.quantity;
                const colors = GROUP_COLORS[groupName] ?? "bg-gray-50 text-gray-600";
                return (
                  <button
                    key={ing.id}
                    onClick={() => router.push(`/inventario?cat=${ing.product.category}`)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      ok ? colors : "bg-red-50 text-red-600"
                    )}
                  >
                    {ing.product.icon && `${ing.product.icon} `}
                    {ing.product.name}{" "}
                    <span className="opacity-70">×{ing.quantity}/{ing.product.units}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {/* Optional */}
          {optional.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {optional.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => router.push(`/inventario?cat=${ing.product.category}`)}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium"
                >
                  {ing.product.icon && `${ing.product.icon} `}
                  {ing.product.name}{" "}
                  <span className="opacity-70">×{ing.quantity}/{ing.product.units}</span>
                </button>
              ))}
            </div>
          )}
          {/* Sides */}
          {hasSides && (
            <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acompañantes</span>
              {[...sideGroups.entries()].map(([groupName, members]) => (
                <div key={groupName} className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", GROUP_COLORS[groupName] ?? "bg-gray-100 text-gray-600")}>
                    {members[0]?.groupMin ?? 1}/{members.length}
                  </span>
                  {members.map((s) => {
                    const ok = isSideAvailable(s.side);
                    const colors = GROUP_COLORS[groupName] ?? "bg-gray-50 text-gray-600";
                    return (
                      <span
                        key={s.id}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          ok ? colors : "bg-red-50 text-red-600"
                        )}
                      >
                        {s.side.emoji || "🍽️"} {s.side.name}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
