"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Trash2, Loader2 } from "lucide-react";
import type { Dish, DayOfWeek, MealType, PlanSlot, WeekPlan } from "@prisma/client";
import { DAY_LABELS, DAY_ORDER, MEAL_ORDER } from "@/lib/constants";
import { generateWeekPlan, clearWeekPlan, loadWeekPlan } from "@/actions/plan";
import { cn } from "@/lib/utils";
import PlanSlotCard from "./PlanSlotCard";

type SlotWithDish = PlanSlot & { dish: Dish | null };
type WeekPlanFull = WeekPlan & { slots: SlotWithDish[] };

interface WeekPlanViewProps {
  initialPlan: WeekPlanFull;
  dishes: Dish[];
}

function formatWeekRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return `${fmt(start)} – ${fmt(end)}`;
}

function isCurrentWeek(weekStart: Date): boolean {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const ws = new Date(weekStart);
  ws.setHours(0, 0, 0, 0);

  return ws.getTime() === monday.getTime();
}

function getTodayDayOfWeek(): DayOfWeek | null {
  const jsDay = new Date().getDay(); // 0=Sun
  if (jsDay === 0) return "DOMINGO";
  return DAY_ORDER[jsDay - 1] ?? null;
}

export default function WeekPlanView({ initialPlan, dishes }: WeekPlanViewProps) {
  const [plan, setPlan] = useState<WeekPlanFull>(initialPlan);
  const [isPending, startTransition] = useTransition();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const weekStart = new Date(plan.weekStart);
  const currentWeek = isCurrentWeek(weekStart);
  const todayDay = currentWeek ? getTodayDayOfWeek() : null;

  const slotMap = new Map<string, SlotWithDish>();
  plan.slots.forEach((s) => slotMap.set(`${s.day}-${s.meal}`, s));

  function navigate(offset: number) {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    startTransition(async () => {
      const newPlan = await loadWeekPlan(newStart.toISOString());
      setPlan(newPlan);
    });
  }

  function refreshPlan() {
    startTransition(async () => {
      const updated = await loadWeekPlan(weekStart.toISOString());
      setPlan(updated);
    });
  }

  function handleGenerate() {
    startTransition(async () => {
      const newPlan = await generateWeekPlan(weekStart.toISOString());
      setPlan(newPlan);
    });
  }

  function handleClear() {
    setShowClearConfirm(false);
    startTransition(async () => {
      await clearWeekPlan(plan.id);
      const newPlan = await loadWeekPlan(weekStart.toISOString());
      setPlan(newPlan);
    });
  }

  const filledSlots = plan.slots.filter((s) => s.dishId || s.eatenOut).length;
  const totalSlots = 14;

  // Active dishes for the picker
  const activeDishes = dishes.filter((d) => d.active);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 md:top-12 bg-surface border-b border-border-default z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-primary">
            <span className="mr-1.5">📅</span>Plan semanal
          </h1>
          <div className="flex items-center gap-1">
            {filledSlots > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-9 h-9 flex items-center justify-center text-faint active:text-danger-text"
                title="Limpiar plan"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={isPending || activeDishes.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                isPending
                  ? "bg-accent-muted text-accent-text"
                  : "bg-accent text-inverted active:bg-accent-hover",
                activeDishes.length === 0 && "opacity-40"
              )}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Generar
            </button>
          </div>
        </div>

        {/* Week navigator */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            disabled={isPending}
            className="w-9 h-9 flex items-center justify-center text-muted active:text-secondary"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {formatWeekRange(weekStart)}
            </p>
            {currentWeek && (
              <p className="text-xs text-accent-text font-medium">Esta semana</p>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            disabled={isPending}
            className="w-9 h-9 flex items-center justify-center text-muted active:text-secondary"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Days */}
      <div className={cn("pb-20", isPending && "opacity-60 pointer-events-none")}>
        {DAY_ORDER.map((day) => {
          const isToday = day === todayDay;
          return (
            <section key={day}>
              {/* Day header */}
              <div
                className={cn(
                  "px-4 py-2 text-sm font-bold uppercase tracking-wider border-b border-border-subtle",
                  isToday
                    ? "bg-accent-soft text-accent-text"
                    : "bg-surface-alt text-muted"
                )}
              >
                {DAY_LABELS[day]}
                {isToday && (
                  <span className="ml-2 text-xs font-medium normal-case tracking-normal text-accent-text">
                    hoy
                  </span>
                )}
              </div>

              {/* Meal slots */}
              {MEAL_ORDER.map((meal) => {
                const slot = slotMap.get(`${day}-${meal}`);
                return (
                  <PlanSlotCard
                    key={`${day}-${meal}`}
                    weekPlanId={plan.id}
                    day={day}
                    meal={meal}
                    dish={slot?.dish ?? null}
                    eatenOut={slot?.eatenOut ?? false}
                    allDishes={activeDishes}
                    onMutate={refreshPlan}
                  />
                );
              })}
            </section>
          );
        })}
      </div>

      {/* Empty state hint — only when no dishes exist */}
      {filledSlots === 0 && !isPending && activeDishes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: 140 }}>
          <div className="text-center text-faint px-8">
            <p className="text-sm">Añade platos en el catálogo para poder generar un plan</p>
          </div>
        </div>
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <>
          <div
            className="fixed inset-0 bg-overlay z-[70]"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[80] px-4 pt-6 pb-8 sheet-popup-confirm">
            <p className="text-base font-semibold text-primary text-center mb-2">
              Limpiar plan
            </p>
            <p className="text-sm text-muted text-center mb-6">
              Se borrarán todos los platos asignados esta semana
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-pressed"
              >
                Cancelar
              </button>
              <button
                onClick={handleClear}
                className="flex-1 h-12 rounded-xl bg-danger text-inverted font-semibold text-base active:bg-danger-hover"
              >
                Limpiar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
