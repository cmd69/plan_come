"use client";

import { useTransition, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_EMOJIS, PRODUCT_CATEGORY_ORDER } from "@/lib/constants";
import type { Product } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (product) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      onClose();
    });
  }

  return (
    <>
      {/* Overlay — por encima del nav (z-50) */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Sheet — por encima del overlay */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? "Editar producto" : "Nuevo producto"}
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
              defaultValue={product?.name ?? ""}
              required
              placeholder="Ej: Alitas de pollo"
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              name="category"
              defaultValue={product?.category ?? ""}
              required
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors appearance-none"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {PRODUCT_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {PRODUCT_CATEGORY_EMOJIS[cat]} {PRODUCT_CATEGORY_LABELS[cat]}
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
