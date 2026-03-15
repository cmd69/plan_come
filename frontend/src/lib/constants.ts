import { ProductCategory, DishCategory } from "@prisma/client";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  CARNES_PROTEINAS: "Carnes y proteínas",
  LACTEOS: "Lácteos",
  FRUTAS_VERDURAS: "Frutas y verduras",
  DESPENSA: "Despensa",
  BEBIDAS: "Bebidas",
  HIGIENE_LIMPIEZA: "Higiene y limpieza",
  OTROS: "Otros",
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "CARNES_PROTEINAS",
  "LACTEOS",
  "FRUTAS_VERDURAS",
  "DESPENSA",
  "BEBIDAS",
  "HIGIENE_LIMPIEZA",
  "OTROS",
];

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  PASTA: "Pasta",
  ARROZ: "Arroz",
  CARNE: "Carne",
  PESCADO: "Pescado",
  LEGUMBRES: "Legumbres",
  HUEVOS: "Huevos",
  OTRO: "Otro",
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
