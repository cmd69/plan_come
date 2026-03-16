"use client";

import { useState, useTransition } from "react";
import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dish, DayOfWeek, MealType } from "@prisma/client";
import { MEAL_LABELS, MEAL_EMOJIS } from "@/lib/constants";
import { setSlotDish, toggleEatenOut, regenerateSlot } from "@/actions/plan";
import SlotPicker from "./SlotPicker";

interface PlanSlotCardProps {
  weekPlanId: number;
  day: DayOfWeek;
  meal: MealType;
  dish: Dish | null;
  eatenOut: boolean;
  allDishes: Dish[];
  onMutate: () => void;
}

export default function PlanSlotCard({
  weekPlanId,
  day,
  meal,
  dish,
  eatenOut,
  allDishes,
  onMutate,
}: PlanSlotCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);

  function handleSelectDish(dishId: number | null) {
    setShowPicker(false);
    startTransition(async () => {
      await setSlotDish(weekPlanId, day, meal, dishId);
      onMutate();
    });
  }

  function handleToggleEatenOut() {
    startTransition(async () => {
      await toggleEatenOut(weekPlanId, day, meal);
      onMutate();
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      await regenerateSlot(weekPlanId, day, meal);
      onMutate();
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 min-h-[56px] transition-opacity",
          isPending && "opacity-50"
        )}
      >
        {/* Meal label */}
        <div className="w-16 shrink-0">
          <span className="text-xs text-muted flex items-center gap-1">
            <span>{MEAL_EMOJIS[meal]}</span>
            {MEAL_LABELS[meal]}
          </span>
        </div>

        {/* Slot content — tappable */}
        <button
          onClick={() => setShowPicker(true)}
          className={cn(
            "flex-1 text-left text-sm rounded-xl px-3 py-2.5 min-h-[44px] flex items-center",
            eatenOut
              ? "bg-pressed text-faint line-through"
              : dish
              ? "bg-accent-soft text-primary font-medium"
              : "bg-surface-alt text-faint border border-dashed border-border-default"
          )}
        >
          {eatenOut ? (
            "Fuera de casa"
          ) : dish ? (
            <><span>{dish.emoji || "🍽️"}</span> {dish.name}</>
          ) : (
            <span className="italic">Sin plato</span>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRegenerate}
            disabled={isPending || eatenOut}
            className="w-9 h-9 flex items-center justify-center text-faint active:text-accent-text disabled:opacity-30"
            title="Regenerar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleToggleEatenOut}
            disabled={isPending}
            className={cn(
              "w-9 h-9 flex items-center justify-center active:text-amber-600 disabled:opacity-30",
              eatenOut ? "text-amber-500" : "text-faint"
            )}
            title="Fuera de casa"
          >
            <UtensilsCrossed size={16} />
          </button>
        </div>
      </div>

      {showPicker && (
        <SlotPicker
          dishes={allDishes}
          meal={meal}
          onSelect={handleSelectDish}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
