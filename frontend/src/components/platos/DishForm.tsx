"use client";

import { useTransition, useRef, useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { createDish, updateDish, type IngredientInput } from "@/actions/dishes";
import {
  DISH_CATEGORY_LABELS,
  DISH_CATEGORY_EMOJIS,
  DISH_CATEGORY_ORDER,
} from "@/lib/constants";
import type { Dish, DishIngredient, Product } from "@prisma/client";
import { cn } from "@/lib/utils";

type DishIngredientWithProduct = DishIngredient & { product: Product };
type DishFull = Dish & { ingredients: DishIngredientWithProduct[] };

interface DishFormProps {
  dish?: DishFull | null;
  products: Product[];
  onClose: () => void;
}

export default function DishForm({ dish, products, onClose }: DishFormProps) {
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    dish?.ingredients.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      optional: i.optional,
    })) ?? []
  );

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function addIngredient() {
    const firstUnused = products.find(
      (p) => !ingredients.some((i) => i.productId === p.id)
    );
    if (!firstUnused) return;
    setIngredients((prev) => [
      ...prev,
      { productId: firstUnused.id, quantity: 1, optional: false },
    ]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, patch: Partial<IngredientInput>) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing))
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
        ingredients,
      };
      if (dish) {
        await updateDish(dish.id, data);
      } else {
        await createDish(data);
      }
      onClose();
    });
  }

  const availableProducts = products.filter(
    (p, _, arr) => arr.length > 0
  );

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

          {/* Ingredientes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Ingredientes</label>
              <button
                type="button"
                onClick={addIngredient}
                disabled={ingredients.length >= availableProducts.length}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 disabled:text-gray-300"
              >
                <Plus size={14} />
                Añadir
              </button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                Sin ingredientes — el plato estará siempre disponible
              </p>
            )}

            {ingredients.map((ing, index) => {
              const product = products.find((p) => p.id === ing.productId);
              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex flex-col gap-2"
                >
                  {/* Selector de producto */}
                  <div className="flex items-center gap-2">
                    <select
                      value={ing.productId}
                      onChange={(e) =>
                        updateIngredient(index, { productId: Number(e.target.value) })
                      }
                      className="flex-1 h-10 px-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-emerald-500 appearance-none"
                    >
                      {products.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={
                            p.id !== ing.productId &&
                            ingredients.some((i, idx) => idx !== index && i.productId === p.id)
                          }
                        >
                          {p.icon ? `${p.icon} ` : ""}{p.name} · {p.units} ud.
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="w-9 h-9 flex items-center justify-center text-gray-400 active:text-red-500 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Cantidad + Opcional */}
                  <div className="flex items-center gap-3">
                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Cantidad</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateIngredient(index, {
                            quantity: Math.max(1, ing.quantity - 1),
                          })
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-base font-semibold text-gray-700 disabled:opacity-30"
                        disabled={ing.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">
                        {ing.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateIngredient(index, { quantity: ing.quantity + 1 })
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-base font-semibold text-gray-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Separador */}
                    <div className="h-4 w-px bg-gray-200" />

                    {/* Opcional */}
                    <button
                      type="button"
                      onClick={() =>
                        updateIngredient(index, { optional: !ing.optional })
                      }
                      className={cn(
                        "h-7 px-3 rounded-full text-xs font-semibold transition-colors",
                        ing.optional
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {ing.optional ? "Opcional" : "Obligatorio"}
                    </button>

                    {/* Aviso sin stock */}
                    {product && product.units < ing.quantity && (
                      <span className="text-xs text-red-400 ml-auto">
                        Sin stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
    </>
  );
}
