"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Trash2 } from "lucide-react";
import { toggleDishActive, deleteDish } from "@/actions/dishes";
import { DISH_TYPE_LABELS, DISH_TYPE_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DishFull } from "./DishCard";

const GROUP_COLORS: Record<string, string> = {
  A: "bg-blue-50 text-blue-700",
  B: "bg-violet-50 text-violet-700",
  C: "bg-teal-50 text-teal-700",
  D: "bg-cyan-50 text-cyan-700",
  E: "bg-rose-50 text-rose-700",
  F: "bg-amber-50 text-amber-700",
};

interface DishDetailSheetProps {
  dish: DishFull;
  onEdit: () => void;
  onClose: () => void;
}

export default function DishDetailSheet({ dish, onEdit, onClose }: DishDetailSheetProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const required = dish.ingredients.filter((i) => !i.optional);
  const optional = dish.ingredients.filter((i) => i.optional);
  const hasIngredients = dish.ingredients.length > 0;
  const hasSides = dish.sides.length > 0;

  const standalone = required.filter((i) => !i.group);
  const groups = new Map<string, typeof required>();
  for (const ing of required) {
    if (ing.group) {
      const list = groups.get(ing.group) ?? [];
      list.push(ing);
      groups.set(ing.group, list);
    }
  }

  const sideGroups = new Map<string, typeof dish.sides>();
  for (const s of dish.sides) {
    const g = s.group ?? "A";
    const list = sideGroups.get(g) ?? [];
    list.push(s);
    sideGroups.set(g, list);
  }

  function isSideAvailable(side: typeof dish.sides[0]["side"]): boolean {
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

  const standaloneOk = standalone.every((i) => i.product.units >= i.quantity);
  const groupsOk = [...groups.values()].every((members) => {
    const min = members[0]?.groupMin ?? 1;
    return members.filter((i) => i.product.units >= i.quantity).length >= min;
  });
  const sideGroupsOk = [...sideGroups.values()].every((members) => {
    const min = members[0]?.groupMin ?? 1;
    return members.filter((s) => isSideAvailable(s.side)).length >= min;
  });
  const hasStock = standaloneOk && groupsOk && sideGroupsOk;

  function handleDeleteTap() {
    if (pendingDelete) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      startTransition(async () => {
        await deleteDish(dish.id);
        onClose();
      });
    } else {
      setPendingDelete(true);
      resetTimer.current = setTimeout(() => setPendingDelete(false), 2000);
    }
  }

  function handleToggleActive() {
    startTransition(async () => {
      await toggleDishActive(dish.id, !dish.active);
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-[60]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-elevated rounded-t-2xl z-[65] max-h-[80vh] flex flex-col sheet-popup">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
          <span className="text-3xl">{dish.emoji || "🍽️"}</span>
          <div className="flex-1 min-w-0">
            <p className={cn("text-lg font-semibold text-primary truncate", !dish.active && "line-through opacity-50")}>
              {dish.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-faint">{DISH_TYPE_EMOJIS[dish.type]} {DISH_TYPE_LABELS[dish.type]}</span>
              {(hasIngredients || hasSides) && (
                <>
                  <span className="text-dimmed text-xs">·</span>
                  <span className={cn("text-xs font-medium", hasStock ? "text-accent-text" : "text-danger-text")}>
                    {hasStock ? "Disponible" : "Sin stock"}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-faint shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Notas */}
        {dish.notes && (
          <p className="px-4 pb-2 text-sm text-muted italic">{dish.notes}</p>
        )}

        {/* Ingredientes */}
        {(hasIngredients || hasSides) && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
            {/* Obligatorios standalone */}
            {standalone.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {standalone.map((ing) => {
                  const ok = ing.product.units >= ing.quantity;
                  return (
                    <button
                      key={ing.id}
                      onClick={() => { onClose(); router.push(`/inventario?cat=${ing.product.category}`); }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        ok ? "bg-accent-soft text-accent-text" : "bg-danger-soft text-danger-text"
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

            {/* Grupos de ingredientes */}
            {[...groups.entries()].map(([groupName, members]) => (
              <div key={groupName} className="flex flex-wrap items-center gap-1.5">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", GROUP_COLORS[groupName] ?? "bg-surface-alt text-muted")}>
                  {members[0]?.groupMin ?? 1}/{members.length}
                </span>
                {members.map((ing) => {
                  const ok = ing.product.units >= ing.quantity;
                  const colors = GROUP_COLORS[groupName] ?? "bg-surface-alt text-muted";
                  return (
                    <button
                      key={ing.id}
                      onClick={() => { onClose(); router.push(`/inventario?cat=${ing.product.category}`); }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        ok ? colors : "bg-danger-soft text-danger-text"
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

            {/* Opcionales */}
            {optional.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {optional.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => { onClose(); router.push(`/inventario?cat=${ing.product.category}`); }}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent-text font-medium"
                  >
                    {ing.product.icon && `${ing.product.icon} `}
                    {ing.product.name}{" "}
                    <span className="opacity-70">×{ing.quantity}/{ing.product.units}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Acompañantes */}
            {hasSides && (
              <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-border-subtle">
                <span className="text-[10px] font-bold text-faint uppercase tracking-wider">Acompañantes</span>
                {[...sideGroups.entries()].map(([groupName, members]) => (
                  <div key={groupName} className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", GROUP_COLORS[groupName] ?? "bg-surface-alt text-muted")}>
                      {members[0]?.groupMin ?? 1}/{members.length}
                    </span>
                    {members.map((s) => {
                      const ok = isSideAvailable(s.side);
                      const colors = GROUP_COLORS[groupName] ?? "bg-surface-alt text-muted";
                      return (
                        <span
                          key={s.id}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            ok ? colors : "bg-danger-soft text-danger-text"
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

        {/* Acciones */}
        <div className="shrink-0 border-t border-border-subtle px-4 py-3 flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={cn(
              "h-10 px-4 rounded-xl text-sm font-semibold transition-colors",
              dish.active
                ? "bg-accent-soft text-accent-text active:bg-accent-muted"
                : "bg-pressed text-muted active:bg-pressed-strong"
            )}
          >
            {dish.active ? "Activo" : "Inactivo"}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDeleteTap}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
              pendingDelete ? "bg-danger-soft text-danger-text" : "text-faint active:text-danger-text"
            )}
          >
            <Trash2 size={18} strokeWidth={pendingDelete ? 2.5 : 1.8} />
          </button>
          <button
            onClick={onEdit}
            className="h-10 px-5 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover flex items-center gap-1.5"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>
      </div>
    </>
  );
}
