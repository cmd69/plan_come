"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import type { Product, Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_BG } from "@/lib/constants";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  defaultCategory?: string;
  onClose: () => void;
}

export default function ProductForm({ product, categories, defaultCategory, onClose }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState(product?.priority ?? 0);
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
      <div
        className="fixed inset-0 bg-overlay z-50"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-elevated rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-primary">
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-faint rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-8 flex flex-col gap-4 overflow-y-auto">
          {/* Icono + Nombre */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 w-16 shrink-0">
              <label className="text-sm font-medium text-secondary">Icono</label>
              <input
                name="icon"
                type="text"
                defaultValue={product?.icon ?? ""}
                placeholder="🥩"
                maxLength={4}
                className="h-12 px-2 rounded-xl border border-border-default bg-input-bg text-2xl text-center outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-secondary">Nombre</label>
              <input
                ref={firstInputRef}
                name="name"
                type="text"
                defaultValue={product?.name ?? ""}
                required
                placeholder="Ej: Alitas de pollo"
                className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Categoría</label>
            <select
              name="category"
              defaultValue={product?.category ?? defaultCategory ?? ""}
              required
              className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors appearance-none"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Prioridad</label>
            <input type="hidden" name="priority" value={priority} />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-medium transition-colors border",
                    priority === p
                      ? PRIORITY_BG[p] + " border-current"
                      : "bg-input-bg text-faint border-border-default active:bg-pressed"
                  )}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-surface-alt"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold text-base text-inverted transition-colors",
                isPending ? "bg-accent/70" : "bg-accent active:bg-accent-hover"
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
