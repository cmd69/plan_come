import { DishType, DayOfWeek, MealType } from "@prisma/client";
import type { Category } from "@prisma/client";

// ─── Prioridad de productos ──────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<number, string> = {
  0: "Sin",
  1: "Baja",
  2: "Media",
  3: "Alta",
};

export const PRIORITY_ICONS: Record<number, string> = {
  0: "",
  1: "!",
  2: "!!",
  3: "!!!",
};

export const PRIORITY_COLORS: Record<number, string> = {
  0: "text-gray-400",
  1: "text-blue-500",
  2: "text-amber-500",
  3: "text-red-500",
};

export const PRIORITY_BG: Record<number, string> = {
  0: "bg-gray-100 text-gray-500",
  1: "bg-blue-50 text-blue-600",
  2: "bg-amber-50 text-amber-600",
  3: "bg-red-50 text-red-600",
};

/** Sort products by priority desc, then name asc */
export function sortByPriority<T extends { priority: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name, "es");
  });
}

// ─── Tipo exportable para categorías dinámicas ───────────────────────────────

export type CategoryInfo = Pick<Category, "slug" | "label" | "emoji">;

/** Build lookup maps from a category list */
export function buildCategoryMaps(categories: CategoryInfo[]) {
  const labels: Record<string, string> = {};
  const emojis: Record<string, string> = {};
  const order: string[] = [];

  for (const cat of categories) {
    labels[cat.slug] = cat.label;
    emojis[cat.slug] = cat.emoji;
    order.push(cat.slug);
  }

  return { labels, emojis, order };
}

// ─── Tipos de plato ─────────────────────────────────────────────────────────

export const DISH_TYPE_LABELS: Record<DishType, string> = {
  COMIDA: "Comidas",
  CENA: "Cenas",
  MIXTO: "Mixtos",
  ACOMPANANTE: "Acompañantes",
};

export const DISH_TYPE_EMOJIS: Record<DishType, string> = {
  COMIDA: "☀️",
  CENA: "🌙",
  MIXTO: "🍽️",
  ACOMPANANTE: "🥗",
};

export const DISH_TYPE_ORDER: DishType[] = [
  "COMIDA",
  "CENA",
  "MIXTO",
  "ACOMPANANTE",
];

// ─── Plan semanal ─────────────────────────────────────────────────────────

export const DAY_LABELS: Record<DayOfWeek, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

export const DAY_ORDER: DayOfWeek[] = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
];

export const MEAL_LABELS: Record<MealType, string> = {
  COMIDA: "Comida",
  CENA: "Cena",
};

export const MEAL_EMOJIS: Record<MealType, string> = {
  COMIDA: "☀️",
  CENA: "🌙",
};

export const MEAL_ORDER: MealType[] = ["COMIDA", "CENA"];
