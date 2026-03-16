"use client";

import { useOptimistic, useTransition, useState, useRef, useCallback } from "react";
import { Pencil, Trash2, Check } from "lucide-react";
import { updateUnits, deleteProduct } from "@/actions/products";
import type { Product } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onLongPress: (id: number) => void;
  onToggleSelect: (id: number) => void;
}

const LONG_PRESS_MS = 500;

export default function ProductCard({
  product,
  onEdit,
  selectionMode,
  isSelected,
  onLongPress,
  onToggleSelect,
}: ProductCardProps) {
  const [, startTransition] = useTransition();
  const [optimisticUnits, addOptimistic] = useOptimistic(
    product.units,
    (current: number, delta: number) => Math.max(0, current + delta)
  );
  const [pendingDelete, setPendingDelete] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function handleDeleteTap() {
    if (pendingDelete) {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      startTransition(async () => {
        await deleteProduct(product.id);
      });
    } else {
      setPendingDelete(true);
      resetTimer.current = setTimeout(() => setPendingDelete(false), 2000);
    }
  }

  function handleUnit(delta: number) {
    startTransition(async () => {
      addOptimistic(delta);
      await updateUnits(product.id, delta);
    });
  }

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(product.id);
    }, LONG_PRESS_MS);
  }, [onLongPress, product.id]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (didLongPress.current) return;
    if (selectionMode) {
      onToggleSelect(product.id);
    }
  }, [selectionMode, onToggleSelect, product.id]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 transition-colors",
        selectionMode && "cursor-pointer select-none",
        isSelected && "bg-emerald-50"
      )}
      onPointerDown={selectionMode ? undefined : handlePointerDown}
      onPointerUp={selectionMode ? undefined : handlePointerUp}
      onPointerCancel={selectionMode ? undefined : handlePointerUp}
      onClick={selectionMode ? handleClick : undefined}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            isSelected
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-gray-300"
          )}
        >
          {isSelected && <Check size={14} strokeWidth={3} />}
        </div>
      )}

      {/* Icono + Nombre */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {product.icon && (
          <span className="text-xl shrink-0">{product.icon}</span>
        )}
        <span className="text-base font-medium text-gray-900 truncate">
          {product.name}
        </span>
      </div>

      {!selectionMode && (
        <>
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

            <button
              onClick={handleDeleteTap}
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors",
                pendingDelete ? "text-red-500" : "text-gray-400 active:text-red-500"
              )}
              aria-label={pendingDelete ? "Confirmar eliminación" : "Eliminar"}
            >
              <Trash2 size={17} strokeWidth={pendingDelete ? 2.5 : 1.8} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
