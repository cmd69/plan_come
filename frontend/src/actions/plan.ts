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

type IngredientInfo = { group: string | null; groupMin: number; productId: number; quantity: number };

/** Check if ingredients are available against a virtual stock map */
function checkIngredients(ingredients: IngredientInfo[], stock: Map<number, number>): boolean {
  if (ingredients.length === 0) return true;
  const standalone = ingredients.filter((i) => !i.group);
  const groups = new Map<string, IngredientInfo[]>();
  for (const ing of ingredients) {
    if (ing.group) {
      const list = groups.get(ing.group) ?? [];
      list.push(ing);
      groups.set(ing.group, list);
    }
  }
  return (
    standalone.every((i) => (stock.get(i.productId) ?? 0) >= i.quantity) &&
    [...groups.values()].every((members) => {
      const min = members[0]?.groupMin ?? 1;
      return members.filter((i) => (stock.get(i.productId) ?? 0) >= i.quantity).length >= min;
    })
  );
}

/** Deduct ingredient quantities from virtual stock */
function deductIngredients(ingredients: IngredientInfo[], stock: Map<number, number>) {
  // For standalone: deduct all
  const standalone = ingredients.filter((i) => !i.group);
  for (const i of standalone) {
    stock.set(i.productId, (stock.get(i.productId) ?? 0) - i.quantity);
  }
  // For groups: deduct only the first available member(s) up to groupMin
  const groups = new Map<string, IngredientInfo[]>();
  for (const ing of ingredients) {
    if (ing.group) {
      const list = groups.get(ing.group) ?? [];
      list.push(ing);
      groups.set(ing.group, list);
    }
  }
  for (const members of groups.values()) {
    const min = members[0]?.groupMin ?? 1;
    let picked = 0;
    for (const m of members) {
      if (picked >= min) break;
      if ((stock.get(m.productId) ?? 0) >= m.quantity) {
        stock.set(m.productId, (stock.get(m.productId) ?? 0) - m.quantity);
        picked++;
      }
    }
  }
}

/** Collect all ingredient infos for a dish (own + sides) */
function getDishIngredients(dish: DishWithIngredients): IngredientInfo[] {
  const own: IngredientInfo[] = dish.ingredients.map((i) => ({
    group: i.group,
    groupMin: i.groupMin,
    productId: i.productId,
    quantity: i.quantity,
  }));

  const sideIngs: IngredientInfo[] = [];
  const sideGroups = new Map<string, typeof dish.sides>();
  for (const s of dish.sides) {
    const g = s.group ?? "A";
    const list = sideGroups.get(g) ?? [];
    list.push(s);
    sideGroups.set(g, list);
  }
  // For each side group, pick the first available side and include its ingredients
  for (const members of sideGroups.values()) {
    for (const s of members) {
      for (const i of s.side.ingredients) {
        sideIngs.push({
          group: i.group,
          groupMin: i.groupMin,
          productId: i.productId,
          quantity: i.quantity,
        });
      }
      break; // Take first side per group for deduction estimate
    }
  }

  return [...own, ...sideIngs];
}

type DishWithIngredients = Awaited<ReturnType<typeof fetchDishesWithIngredients>>[number];

async function fetchDishesWithIngredients() {
  return prisma.dish.findMany({
    where: { active: true, type: { not: "ACOMPANANTE" } },
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
}

/** Check if a dish is available against virtual stock (own + sides) */
function isDishAvailable(dish: DishWithIngredients, stock: Map<number, number>): boolean {
  const ownIngs: IngredientInfo[] = dish.ingredients.map((i) => ({
    group: i.group, groupMin: i.groupMin, productId: i.productId, quantity: i.quantity,
  }));
  if (!checkIngredients(ownIngs, stock)) return false;

  const sideGroups = new Map<string, typeof dish.sides>();
  for (const s of dish.sides) {
    const g = s.group ?? "A";
    const list = sideGroups.get(g) ?? [];
    list.push(s);
    sideGroups.set(g, list);
  }
  return [...sideGroups.values()].every((members) => {
    const min = members[0]?.groupMin ?? 1;
    return members.filter((s) => {
      const sideIngs: IngredientInfo[] = s.side.ingredients.map((i) => ({
        group: i.group, groupMin: i.groupMin, productId: i.productId, quantity: i.quantity,
      }));
      return checkIngredients(sideIngs, stock);
    }).length >= min;
  });
}

/** Generate a full week plan */
export async function generateWeekPlan(weekStartISO: string) {
  const weekStart = new Date(weekStartISO);
  weekStart.setHours(0, 0, 0, 0);

  const plan = await getOrCreateWeekPlan(weekStart);
  const dishes = await fetchDishesWithIngredients();

  // Build virtual stock from all products used in dish ingredients
  const allProducts = await prisma.product.findMany({ select: { id: true, units: true } });
  const stock = new Map(allProducts.map((p) => [p.id, p.units]));

  const existingSlots = new Map(
    plan.slots.map((s) => [`${s.day}-${s.meal}`, s])
  );

  // Track used dish IDs (including pre-existing ones) to prevent repeats
  const usedDishIds = new Set<number>();
  for (const slot of plan.slots) {
    if (slot.dishId) usedDishIds.add(slot.dishId);
  }

  // Deduct stock for already-assigned dishes
  for (const slot of plan.slots) {
    if (slot.dishId) {
      const dish = dishes.find((d) => d.id === slot.dishId);
      if (dish) {
        deductIngredients(getDishIngredients(dish), stock);
      }
    }
  }

  for (const day of DAY_ORDER) {
    for (const meal of MEAL_ORDER) {
      const key = `${day}-${meal}`;
      const existing = existingSlots.get(key);

      // Skip if slot already has a dish or is marked eaten out
      if (existing?.dishId || existing?.eatenOut) continue;

      // Saturday and Sunday default to eaten out
      if (day === "SABADO" || day === "DOMINGO") {
        if (existing) {
          await prisma.planSlot.update({
            where: { id: existing.id },
            data: { eatenOut: true, dishId: null },
          });
        } else {
          await prisma.planSlot.create({
            data: {
              weekPlanId: plan.id,
              day: day as DayOfWeek,
              meal: meal as MealType,
              eatenOut: true,
            },
          });
        }
        continue;
      }

      // Filter: correct meal type, not already used, available with current stock
      const candidates = dishes.filter((d) =>
        (d.type === "MIXTO" || d.type === meal) &&
        !usedDishIds.has(d.id) &&
        isDishAvailable(d, stock)
      );

      if (candidates.length === 0) continue; // Leave blank

      // Pick random
      const dish = candidates[Math.floor(Math.random() * candidates.length)];
      usedDishIds.add(dish.id);

      // Deduct ingredients from virtual stock
      deductIngredients(getDishIngredients(dish), stock);

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

/** Regenerate a single slot with a random available dish (respects stock & no repeats) */
export async function regenerateSlot(
  weekPlanId: number,
  day: DayOfWeek,
  meal: MealType
) {
  const allDishes = await fetchDishesWithIngredients();

  // Build virtual stock
  const allProducts = await prisma.product.findMany({ select: { id: true, units: true } });
  const stock = new Map(allProducts.map((p) => [p.id, p.units]));

  // Get all slots for this week
  const slots = await prisma.planSlot.findMany({ where: { weekPlanId } });

  // Collect used dish IDs and deduct stock for other slots.
  // The current slot's dish is excluded from stock deduction but still added to usedDishIds
  // so it cannot be suggested again.
  const currentSlot = slots.find((s) => s.day === day && s.meal === meal);
  const usedDishIds = new Set<number>();
  if (currentSlot?.dishId) usedDishIds.add(currentSlot.dishId);
  for (const slot of slots) {
    if (slot.dishId && !(slot.day === day && slot.meal === meal)) {
      usedDishIds.add(slot.dishId);
      const dish = allDishes.find((d) => d.id === slot.dishId);
      if (dish) deductIngredients(getDishIngredients(dish), stock);
    }
  }

  const candidates = allDishes.filter((d) =>
    (d.type === "MIXTO" || d.type === meal) &&
    !usedDishIds.has(d.id) &&
    isDishAvailable(d, stock)
  );

  if (candidates.length === 0) {
    // Clear the slot if no candidates
    await prisma.planSlot.upsert({
      where: { weekPlanId_day_meal: { weekPlanId, day, meal } },
      create: { weekPlanId, day, meal, dishId: null, eatenOut: false },
      update: { dishId: null, eatenOut: false },
    });
    revalidatePath("/plan");
    return;
  }

  const dish = candidates[Math.floor(Math.random() * candidates.length)];

  await prisma.planSlot.upsert({
    where: { weekPlanId_day_meal: { weekPlanId, day, meal } },
    create: { weekPlanId, day, meal, dishId: dish.id, eatenOut: false },
    update: { dishId: dish.id, eatenOut: false },
  });

  revalidatePath("/plan");
}
