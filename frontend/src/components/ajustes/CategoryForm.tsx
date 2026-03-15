"use client";

import { useTransition, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createCategory, updateCategory } from "@/actions/categories";
import type { Category } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const emojiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emojiRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (category) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onClose();
    });
  }

  // Auto-generate slug from label
  function handleLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = e.currentTarget.form?.querySelector<HTMLInputElement>(
      'input[name="slug"]'
    );
    if (slugInput && !category) {
      slugInput.value = e.target.value
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-4 pb-8 flex flex-col gap-4 overflow-y-auto"
        >
          {/* Emoji + Label */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 w-16 shrink-0">
              <label className="text-sm font-medium text-gray-700">Emoji</label>
              <input
                ref={emojiRef}
                name="emoji"
                type="text"
                defaultValue={category?.emoji ?? ""}
                required
                placeholder="📦"
                maxLength={4}
                className="h-12 px-2 rounded-xl border border-gray-200 bg-gray-50 text-2xl text-center outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="label"
                type="text"
                defaultValue={category?.label ?? ""}
                required
                placeholder="Ej: Congelados"
                onChange={handleLabelChange}
                className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Identificador{" "}
              <span className="text-gray-400 font-normal">(para CSV)</span>
            </label>
            <input
              name="slug"
              type="text"
              defaultValue={category?.slug ?? ""}
              required
              placeholder="CONGELADOS"
              className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 text-base font-mono outline-none focus:border-emerald-500 focus:bg-white transition-colors uppercase"
            />
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
                isPending
                  ? "bg-emerald-400"
                  : "bg-emerald-600 active:bg-emerald-700"
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
