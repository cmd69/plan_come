"use client";

import { useTransition, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createDish, updateDish } from "@/actions/dishes";
import {
  DISH_CATEGORY_LABELS,
  DISH_CATEGORY_EMOJIS,
  DISH_CATEGORY_ORDER,
} from "@/lib/constants";
import type { Dish, Product } from "@prisma/client";
import { cn } from "@/lib/utils";

type DishWithProduct = Dish & { mainProduct: Product | null };

interface DishFormProps {
  dish?: DishWithProduct | null;
  products: Product[];
  onClose: () => void;
}

export default function DishForm({ dish, products, onClose }: DishFormProps) {
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (dish) {
        await updateDish(dish.id, formData);
      } else {
        await createDish(formData);
      }
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {dish ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-8 flex flex-col gap-4 overflow-y-auto">
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
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {DISH_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {DISH_CATEGORY_EMOJIS[cat]} {DISH_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Ingrediente principal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Ingrediente principal{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              name="mainProductId"
              defaultValue={dish?.mainProductId ?? ""}
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors appearance-none"
            >
              <option value="">Sin ingrediente</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon ? `${p.icon} ` : ""}{p.name}
                  {p.units === 0 ? " (sin stock)" : ` · ${p.units} ud.`}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
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
