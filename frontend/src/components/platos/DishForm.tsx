"use client";

import { useTransition, useRef, useEffect, useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { createDish, updateDish, type IngredientInput, type SideInput } from "@/actions/dishes";
import {
  DISH_CATEGORY_LABELS,
  DISH_CATEGORY_EMOJIS,
  DISH_CATEGORY_ORDER,
} from "@/lib/constants";
import type { Product, Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import IngredientPicker from "./IngredientPicker";
import type { DishFull } from "./DishCard";

interface DishFormProps {
  dish?: DishFull | null;
  allDishes: DishFull[];
  products: Product[];
  categories: Category[];
  onClose: () => void;
}

export default function DishForm({ dish, allDishes, products, categories, onClose }: DishFormProps) {
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isSide, setIsSide] = useState(dish?.isSide ?? false);

  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    dish?.ingredients.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      optional: i.optional,
      group: i.group,
    })) ?? []
  );

  const [sides, setSides] = useState<SideInput[]>(
    dish?.sides.map((s) => ({ sideId: s.sideId, group: s.group })) ?? []
  );

  // Available side dishes (excluding self)
  const availableSides = allDishes.filter(
    (d) => d.isSide && d.id !== dish?.id
  );

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function updateQuantity(productId: number, delta: number) {
    setIngredients((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  }

  function removeIngredient(productId: number) {
    setIngredients((prev) => prev.filter((i) => i.productId !== productId));
  }

  const GROUP_LABELS = ["A", "B", "C", "D"];
  const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    B: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
    C: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
    D: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  };

  function cycleGroup(productId: number) {
    setIngredients((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const currentIdx = i.group ? GROUP_LABELS.indexOf(i.group) : -1;
        const nextIdx = currentIdx + 1;
        const nextGroup = nextIdx < GROUP_LABELS.length ? GROUP_LABELS[nextIdx] : null;
        return { ...i, group: nextGroup, optional: false };
      })
    );
  }

  function toggleSide(sideId: number) {
    setSides((prev) => {
      const exists = prev.find((s) => s.sideId === sideId);
      if (exists) return prev.filter((s) => s.sideId !== sideId);
      return [...prev, { sideId, group: null }];
    });
  }

  function cycleSideGroup(sideId: number) {
    setSides((prev) =>
      prev.map((s) => {
        if (s.sideId !== sideId) return s;
        const currentIdx = s.group ? GROUP_LABELS.indexOf(s.group) : -1;
        const nextIdx = currentIdx + 1;
        const nextGroup = nextIdx < GROUP_LABELS.length ? GROUP_LABELS[nextIdx] : null;
        return { ...s, group: nextGroup };
      })
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const data = {
        name: fd.get("name") as string,
        category: fd.get("category") as Parameters<typeof createDish>[0]["category"],
        notes: (fd.get("notes") as string) || null,
        isSide,
        ingredients,
        sides: isSide ? [] : sides,
      };
      if (dish) {
        await updateDish(dish.id, data);
      } else {
        await createDish(data);
      }
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {dish ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-8 flex flex-col gap-5 overflow-y-auto">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              ref={firstInputRef}
              name="name"
              type="text"
              defaultValue={dish?.name ?? ""}
              required
              placeholder="Ej: Pollo al horno"
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              name="category"
              defaultValue={dish?.category ?? ""}
              required
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors appearance-none"
            >
              <option value="" disabled>Selecciona una categoría</option>
              {DISH_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {DISH_CATEGORY_EMOJIS[cat]} {DISH_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Acompañante toggle */}
          <button
            type="button"
            onClick={() => setIsSide((v) => !v)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors",
              isSide ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-gray-50"
            )}
          >
            <span className="text-lg">🍽️</span>
            <span className="flex-1 text-sm font-medium text-gray-700 text-left">
              Es un acompañante
            </span>
            <div className={cn(
              "w-10 h-6 rounded-full relative transition-colors",
              isSide ? "bg-orange-500" : "bg-gray-300"
            )}>
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                isSide ? "translate-x-[18px]" : "translate-x-0.5"
              )} />
            </div>
          </button>

          {/* Acompañantes selector (solo para platos principales) */}
          {!isSide && availableSides.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Acompañantes
              </label>
              <div className="flex flex-col gap-1.5">
                {availableSides.map((sideDish) => {
                  const selected = sides.find((s) => s.sideId === sideDish.id);
                  return (
                    <div
                      key={sideDish.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
                        selected
                          ? selected.group && GROUP_COLORS[selected.group]
                            ? `${GROUP_COLORS[selected.group].border} ${GROUP_COLORS[selected.group].bg}/30`
                            : "border-orange-200 bg-orange-50/50"
                          : "border-gray-200 bg-gray-50"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSide(sideDish.id)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <span className="text-lg leading-none">
                          {DISH_CATEGORY_EMOJIS[sideDish.category]}
                        </span>
                        <span className={cn(
                          "text-sm font-medium truncate",
                          selected ? "text-gray-800" : "text-gray-400"
                        )}>
                          {sideDish.name}
                        </span>
                      </button>
                      {selected && (
                        <button
                          type="button"
                          onClick={() => cycleSideGroup(sideDish.id)}
                          className={cn(
                            "shrink-0 h-6 px-1.5 rounded-full text-[10px] font-bold border transition-colors",
                            selected.group && GROUP_COLORS[selected.group]
                              ? `${GROUP_COLORS[selected.group].bg} ${GROUP_COLORS[selected.group].text} ${GROUP_COLORS[selected.group].border}`
                              : "bg-gray-100 text-gray-400 border-gray-200"
                          )}
                        >
                          {selected.group ? `GRP ${selected.group}` : "GRP"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ingredientes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Ingredientes
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 active:text-emerald-700"
              >
                <Plus size={14} />
                {ingredients.length > 0 ? "Editar" : "Añadir"}
              </button>
            </div>

            {ingredients.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="py-6 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 active:bg-gray-50"
              >
                Toca para seleccionar ingredientes
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                {ingredients.map((ing) => {
                  const product = products.find((p) => p.id === ing.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={ing.productId}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border",
                        ing.optional
                          ? "border-amber-200 bg-amber-50/50"
                          : ing.group && GROUP_COLORS[ing.group]
                            ? `${GROUP_COLORS[ing.group].border} ${GROUP_COLORS[ing.group].bg}/30`
                            : "border-gray-200 bg-gray-50"
                      )}
                    >
                      <span className="text-lg leading-none">
                        {product.icon || "📦"}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                        {product.name}
                      </span>
                      {ing.optional && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          OPC
                        </span>
                      )}
                      {/* Group toggle — tap to cycle A→B→C→D→none */}
                      {!ing.optional && (
                        <button
                          type="button"
                          onClick={() => cycleGroup(product.id)}
                          className={cn(
                            "shrink-0 h-6 px-1.5 rounded-full text-[10px] font-bold border transition-colors",
                            ing.group && GROUP_COLORS[ing.group]
                              ? `${GROUP_COLORS[ing.group].bg} ${GROUP_COLORS[ing.group].text} ${GROUP_COLORS[ing.group].border}`
                              : "bg-gray-100 text-gray-400 border-gray-200"
                          )}
                          title="Grupo de alternativas"
                        >
                          {ing.group ? `GRP ${ing.group}` : "GRP"}
                        </button>
                      )}
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          disabled={ing.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-30"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs font-bold tabular-nums">
                          {ing.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeIngredient(product.id)}
                        className="w-6 h-6 flex items-center justify-center text-gray-300 active:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Notas{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="notes"
              defaultValue={dish?.notes ?? ""}
              placeholder="Ej: Marinar 30 min antes, servir con ensalada…"
              rows={3}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-medium text-base active:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold text-base text-white transition-colors",
                isPending ? "bg-emerald-400" : "bg-emerald-600 active:bg-emerald-700"
              )}
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      {/* Ingredient Picker modal */}
      {showPicker && (
        <IngredientPicker
          products={products}
          categories={categories}
          selected={ingredients}
          onChange={setIngredients}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
