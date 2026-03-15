import { DishCategory, DayOfWeek, MealType } from "@prisma/client";
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

// ─── Categorías de platos (siguen siendo enum estático) ──────────────────────

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  PASTA: "Pasta",
  ARROZ: "Arroz",
  CARNE: "Carne",
  PESCADO: "Pescado",
  LEGUMBRES: "Legumbres",
  HUEVOS: "Huevos",
  OTRO: "Otro",
};

export const DISH_CATEGORY_EMOJIS: Record<DishCategory, string> = {
  CARNE: "🥩",
  PESCADO: "🐟",
  PASTA: "🍝",
  ARROZ: "🍚",
  LEGUMBRES: "🫘",
  HUEVOS: "🥚",
  OTRO: "🍽️",
};

export const DISH_CATEGORY_ORDER: DishCategory[] = [
  "CARNE",
  "PESCADO",
  "PASTA",
  "ARROZ",
  "LEGUMBRES",
  "HUEVOS",
  "OTRO",
];

// ─── Plan semanal ─────────────────────────────────────────────────────────────

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
