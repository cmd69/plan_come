"use server";

import { prisma } from "@/lib/prisma";
import { DayOfWeek, MealType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { DAY_ORDER, MEAL_ORDER } from "@/lib/constants";

/** Get Monday of the week containing the given date */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get or create the WeekPlan for a given week start date */
async function getOrCreateWeekPlan(weekStart: Date) {
  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart },
    include: {
      slots: {
        include: { dish: true },
      },
    },
  });

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart },
      include: {
        slots: {
          include: { dish: true },
        },
      },
    });
  }

  return plan;
}

/** Load plan for the current week */
export async function loadCurrentWeekPlan() {
  const weekStart = getWeekStart(new Date());
  return getOrCreateWeekPlan(weekStart);
}

/** Load plan by navigating weeks relative to current: offset=0 current, -1 prev, +1 next */
export async function loadWeekPlanByOffset(offset: number) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const weekStart = getWeekStart(now);
  return getOrCreateWeekPlan(weekStart);
}

/** Load plan for a specific Monday date string (ISO) */
export async function loadWeekPlan(weekStartISO: string) {
  const weekStart = new Date(weekStartISO);
  weekStart.setHours(0, 0, 0, 0);
  return getOrCreateWeekPlan(weekStart);
}

/** Check if a set of required ingredients are all available */
function isDishIngredientsAvailable(
  ingredients: { group: string | null; product: { units: number }; quantity: number }[]
) {
  if (ingredients.length === 0) return true;
  const standalone = ingredients.filter((i) => !i.group);
  const groups = new Map<string, typeof ingredients>();
  for (const ing of ingredients) {
    if (ing.group) {
      const list = groups.get(ing.group) ?? [];
      list.push(ing);
      groups.set(ing.group, list);
    }
  }
  return (
    standalone.every((i) => i.product.units >= i.quantity) &&
    [...groups.values()].every((m) => m.some((i) => i.product.units >= i.quantity))
  );
}

/** Generate a full week plan: fill all empty slots with available dishes */
export async function generateWeekPlan(weekStartISO: string) {
  const weekStart = new Date(weekStartISO);
  weekStart.setHours(0, 0, 0, 0);

  const plan = await getOrCreateWeekPlan(weekStart);

  // Get active non-side dishes with ingredients and sides
  const dishes = await prisma.dish.findMany({
    where: { active: true, isSide: false },
    include: {
      ingredients: {
        where: { optional: false },
        include: { product: true },
      },
      sides: {
        include: {
          side: {
            include: {
              ingredients: {
                where: { optional: false },
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  // Filter to dishes whose required ingredients all have enough stock
  // For grouped ingredients: at least 1 in the group must have stock
  // For sides: same logic per side, and for side groups at least 1 must be available
  const availableDishes = dishes.filter((dish) => {
    // Check own ingredients
    const ownOk = isDishIngredientsAvailable(dish.ingredients);
    if (!ownOk) return false;

    // Check sides availability
    const standaloneSides = dish.sides.filter((s) => !s.group);
    const sideGroups = new Map<string, typeof dish.sides>();
    for (const s of dish.sides) {
      if (s.group) {
        const list = sideGroups.get(s.group) ?? [];
        list.push(s);
        sideGroups.set(s.group, list);
      }
    }
    const standaloneSidesOk = standaloneSides.every((s) =>
      isDishIngredientsAvailable(s.side.ingredients)
    );
    const sideGroupsOk = [...sideGroups.values()].every((members) =>
      members.some((s) => isDishIngredientsAvailable(s.side.ingredients))
    );
    return standaloneSidesOk && sideGroupsOk;
  });

  if (availableDishes.length === 0) return plan;

  // Existing slot dish IDs to know what's already assigned
  const existingSlots = new Map(
    plan.slots.map((s) => [`${s.day}-${s.meal}`, s])
  );

  // Fill empty slots
  for (const day of DAY_ORDER) {
    for (const meal of MEAL_ORDER) {
      const key = `${day}-${meal}`;
      const existing = existingSlots.get(key);

      // Skip if slot already has a dish or is marked eaten out
      if (existing?.dishId || existing?.eatenOut) continue;

      // Pick a random available dish
      const dish =
        availableDishes[Math.floor(Math.random() * availableDishes.length)];

      if (existing) {
        await prisma.planSlot.update({
          where: { id: existing.id },
          data: { dishId: dish.id },
        });
      } else {
        await prisma.planSlot.create({
          data: {
            weekPlanId: plan.id,
            day: day as DayOfWeek,
            meal: meal as MealType,
            dishId: dish.id,
          },
        });
      }
    }
  }

  revalidatePath("/plan");
  return loadWeekPlan(weekStartISO);
}

/** Assign a dish to a specific slot */
export async function setSlotDish(
  weekPlanId: number,
  day: DayOfWeek,
  meal: MealType,
  dishId: number | null
) {
  await prisma.planSlot.upsert({
    where: {
      weekPlanId_day_meal: { weekPlanId, day, meal },
    },
    create: {
      weekPlanId,
      day,
      meal,
      dishId,
      eatenOut: false,
    },
    update: {
      dishId,
      eatenOut: false,
    },
  });
  revalidatePath("/plan");
}

/** Toggle eaten out for a slot */
export async function toggleEatenOut(
  weekPlanId: number,
  day: DayOfWeek,
  meal: MealType
) {
  const existing = await prisma.planSlot.findUnique({
    where: { weekPlanId_day_meal: { weekPlanId, day, meal } },
  });

  if (existing) {
    await prisma.planSlot.update({
      where: { id: existing.id },
      data: {
        eatenOut: !existing.eatenOut,
        dishId: !existing.eatenOut ? null : existing.dishId,
      },
    });
  } else {
    await prisma.planSlot.create({
      data: { weekPlanId, day, meal, eatenOut: true },
    });
  }
  revalidatePath("/plan");
}

/** Clear all slots for a week (reset) */
export async function clearWeekPlan(weekPlanId: number) {
  await prisma.planSlot.deleteMany({ where: { weekPlanId } });
  revalidatePath("/plan");
}

/** Regenerate a single slot with a random available dish */
export async function regenerateSlot(
  weekPlanId: number,
  day: DayOfWeek,
  meal: MealType
) {
  const dishes = await prisma.dish.findMany({
    where: { active: true, isSide: false },
    include: {
      ingredients: {
        where: { optional: false },
        include: { product: true },
      },
      sides: {
        include: {
          side: {
            include: {
              ingredients: {
                where: { optional: false },
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  const available = dishes.filter((dish) => {
    if (!isDishIngredientsAvailable(dish.ingredients)) return false;
    const standaloneSides = dish.sides.filter((s) => !s.group);
    const sideGroups = new Map<string, typeof dish.sides>();
    for (const s of dish.sides) {
      if (s.group) {
        const list = sideGroups.get(s.group) ?? [];
        list.push(s);
        sideGroups.set(s.group, list);
      }
    }
    return (
      standaloneSides.every((s) => isDishIngredientsAvailable(s.side.ingredients)) &&
      [...sideGroups.values()].every((m) =>
        m.some((s) => isDishIngredientsAvailable(s.side.ingredients))
      )
    );
  });

  if (available.length === 0) return;

  const dish = available[Math.floor(Math.random() * available.length)];

  await prisma.planSlot.upsert({
    where: { weekPlanId_day_meal: { weekPlanId, day, meal } },
    create: { weekPlanId, day, meal, dishId: dish.id, eatenOut: false },
    update: { dishId: dish.id, eatenOut: false },
  });

  revalidatePath("/plan");
}
