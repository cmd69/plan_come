"use client";

import { useOptimistic, useTransition, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateUnits, deleteProduct } from "@/actions/products";
import type { Product } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
}

export default function ProductCard({ product, onEdit }: ProductCardProps) {
  const [, startTransition] = useTransition();
  const [optimisticUnits, addOptimistic] = useOptimistic(
    product.units,
    (current: number, delta: number) => Math.max(0, current + delta)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleUnit(delta: number) {
    startTransition(async () => {
      addOptimistic(delta);
      await updateUnits(product.id, delta);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteProduct(product.id);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
      {/* Icono + Nombre */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {product.icon && (
          <span className="text-xl shrink-0">{product.icon}</span>
        )}
        <span className="text-base font-medium text-gray-900 truncate">
          {product.name}
        </span>
      </div>

      {/* Controles de unidades */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleUnit(-1)}
          disabled={optimisticUnits === 0}
          className={cn(
            "w-11 h-11 flex items-center justify-center rounded-full border text-xl font-semibold transition-colors",
            optimisticUnits === 0
              ? "border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 active:bg-gray-100"
          )}
          aria-label="Restar unidad"
        >
          −
        </button>
        <span
          className={cn(
            "w-8 text-center text-lg font-bold tabular-nums",
            optimisticUnits === 0 ? "text-red-500" : "text-gray-900"
          )}
        >
          {optimisticUnits}
        </span>
        <button
          onClick={() => handleUnit(1)}
          className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-300 text-xl font-semibold text-gray-700 active:bg-gray-100 transition-colors"
          aria-label="Sumar unidad"
        >
          +
        </button>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={() => onEdit(product)}
          className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-gray-700"
          aria-label="Editar"
        >
          <Pencil size={17} />
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="text-xs font-semibold text-red-600 px-2 py-1"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 px-1 py-1"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-red-500"
            aria-label="Eliminar"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
