"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { bulkUpdateProducts } from "@/actions/products";
import type { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_BG } from "@/lib/constants";

interface BulkEditFormProps {
  selectedIds: number[];
  categories: Category[];
  onClose: () => void;
}

export default function BulkEditForm({ selectedIds, categories, onClose }: BulkEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Override priority with our state (null = no change)
    formData.delete("priority");
    if (priority !== null) formData.set("priority", String(priority));

    startTransition(async () => {
      await bulkUpdateProducts(selectedIds, formData);
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-elevated rounded-t-2xl z-[60] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-primary">
            Editar {selectedIds.length} producto{selectedIds.length > 1 ? "s" : ""}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-faint rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <p className="px-4 text-xs text-faint mb-3">
          Solo los campos con valor se aplicarán. El resto se mantiene igual.
        </p>

        <form onSubmit={handleSubmit} className="px-4 pb-8 flex flex-col gap-4 overflow-y-auto">
          {/* Icono */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Icono</label>
            <input
              name="icon"
              type="text"
              placeholder="Sin cambio"
              maxLength={4}
              className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-2xl text-center outline-none focus:border-accent focus:bg-input-focus transition-colors w-20"
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Categoría</label>
            <select
              name="category"
              defaultValue=""
              className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors appearance-none"
            >
              <option value="">Sin cambio</option>
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
            <div className="flex gap-2">
              {[null, 0, 1, 2, 3].map((p) => (
                <button
                  key={p ?? "none"}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-medium transition-colors border",
                    priority === p
                      ? p === null
                        ? "bg-pressed-strong text-secondary border-border-strong"
                        : PRIORITY_BG[p] + " border-current"
                      : "bg-input-bg text-faint border-border-default active:bg-pressed"
                  )}
                >
                  {p === null ? "—" : PRIORITY_LABELS[p]}
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
              {isPending ? "Aplicando…" : "Aplicar"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
