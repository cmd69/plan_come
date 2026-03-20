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
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[60] max-h-[90vh] flex flex-col sheet-popup">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-primary">
            {category ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-faint"
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
              <label className="text-sm font-medium text-secondary">Emoji</label>
              <input
                ref={emojiRef}
                name="emoji"
                type="text"
                defaultValue={category?.emoji ?? ""}
                required
                placeholder="📦"
                maxLength={4}
                className="h-12 px-2 rounded-xl border border-border-default bg-input-bg text-2xl text-center outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-secondary">Nombre</label>
              <input
                name="label"
                type="text"
                defaultValue={category?.label ?? ""}
                required
                placeholder="Ej: Congelados"
                onChange={handleLabelChange}
                className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">
              Identificador{" "}
              <span className="text-faint font-normal">(para CSV)</span>
            </label>
            <input
              name="slug"
              type="text"
              defaultValue={category?.slug ?? ""}
              required
              placeholder="CONGELADOS"
              className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base font-mono outline-none focus:border-accent focus:bg-input-focus transition-colors uppercase"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-pressed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold text-base text-inverted transition-colors",
                isPending
                  ? "bg-accent/70"
                  : "bg-accent active:bg-accent-hover"
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
