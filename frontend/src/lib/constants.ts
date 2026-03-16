import { DishType, DayOfWeek, MealType } from "@prisma/client";
import type { Category } from "@prisma/client";

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
