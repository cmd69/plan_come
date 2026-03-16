"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { deleteCategory, reorderCategories } from "@/actions/categories";
import type { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import CategoryForm from "./CategoryForm";

const LONG_PRESS_MS = 300;

interface CategoryManagerProps {
  categories: Category[];
}

export default function CategoryManager({ categories }: CategoryManagerProps) {
  const [formCategory, setFormCategory] = useState<Category | null | undefined>(
    undefined
  );
  const [isPending, startTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localOrder, setLocalOrder] = useState<Category[]>(categories);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragSourceIndex = useRef<number | null>(null);

  // Sync with server
  if (
    categories.length !== localOrder.length ||
    categories.some((c, i) => c.id !== localOrder[i]?.id)
  ) {
    setLocalOrder(categories);
  }

  // Prevent body scroll while dragging
  useEffect(() => {
    if (!isDragActive) return;

    function preventScroll(e: TouchEvent) {
      if (isDragActive) e.preventDefault();
    }

    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [isDragActive]);

  function handleDeleteTap(id: number) {
    if (pendingDeleteId === id) {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
      setPendingDeleteId(null);
      startTransition(() => deleteCategory(id));
    } else {
      setPendingDeleteId(id);
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
      deleteTimer.current = setTimeout(() => setPendingDeleteId(null), 2000);
    }
  }

  function commitReorder(newOrder: Category[]) {
    setLocalOrder(newOrder);
    startTransition(() => reorderCategories(newOrder.map((c) => c.id)));
  }

  function findIndexAtY(y: number): number | null {
    for (const [id, el] of rowRefs.current) {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        const idx = localOrder.findIndex((c) => c.id === id);
        if (idx !== -1) return idx;
      }
    }
    return null;
  }

  function finishDrag() {
    const from = dragSourceIndex.current;
    const to = overIndex;

    setDragIndex(null);
    setOverIndex(null);
    setIsDragActive(false);
    dragSourceIndex.current = null;

    if (from !== null && to !== null && from !== to) {
      const newOrder = [...localOrder];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, moved);
      commitReorder(newOrder);
    }
  }

  // ── Touch handlers ──

  function handleTouchStart(e: React.TouchEvent, index: number) {
    const touch = e.touches[0];
    const startY = touch.clientY;

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
      dragSourceIndex.current = index;
      setDragIndex(index);
      setOverIndex(index);
      setIsDragActive(true);
    }, LONG_PRESS_MS);

    // If finger moves too much before long press, cancel
    function onEarlyMove(ev: TouchEvent) {
      const dy = Math.abs(ev.touches[0].clientY - startY);
      if (dy > 10 && !isDragActive) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        document.removeEventListener("touchmove", onEarlyMove);
      }
    }

    document.addEventListener("touchmove", onEarlyMove, { passive: true });

    // Clean up on touch end if long press didn't fire
    const onEarlyEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      document.removeEventListener("touchmove", onEarlyMove);
      document.removeEventListener("touchend", onEarlyEnd);
    };
    document.addEventListener("touchend", onEarlyEnd, { once: true });
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragActive) return;
    const y = e.touches[0].clientY;
    const target = findIndexAtY(y);
    if (target !== null) setOverIndex(target);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragActive) finishDrag();
  }

  // ── Mouse handlers ──

  function handleMouseDown(e: React.MouseEvent, index: number) {
    e.preventDefault();

    longPressTimer.current = setTimeout(() => {
      dragSourceIndex.current = index;
      setDragIndex(index);
      setOverIndex(index);
      setIsDragActive(true);

      function onMouseMove(ev: MouseEvent) {
        const target = findIndexAtY(ev.clientY);
        if (target !== null) setOverIndex(target);
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        finishDrag();
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }, LONG_PRESS_MS);

    const onEarlyUp = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
    document.addEventListener("mouseup", onEarlyUp, { once: true });
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-wider">
          Categorías de productos
        </h2>
        <button
          onClick={() => setFormCategory(null)}
          className="flex items-center gap-1 text-xs font-semibold text-accent-text active:text-accent-text"
        >
          <Plus size={14} />
          Nueva
        </button>
      </div>

      <div
        className={cn(
          "flex flex-col",
          isPending && !isDragActive && "opacity-60 pointer-events-none"
        )}
      >
        {localOrder.map((cat, index) => {
          const isDragged = dragIndex === index && isDragActive;
          const isOver =
            overIndex === index &&
            isDragActive &&
            dragIndex !== null &&
            dragIndex !== index;

          return (
            <div
              key={cat.id}
              ref={(el) => {
                if (el) rowRefs.current.set(cat.id, el);
                else rowRefs.current.delete(cat.id);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 bg-surface border-b border-border-subtle transition-all duration-100",
                isDragged && "bg-accent-soft shadow-md scale-[1.02] z-10 relative",
                isOver && "border-t-2 border-t-accent"
              )}
            >
              {/* Drag handle — long press to drag */}
              <div
                className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1.5 -ml-1.5"
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, index)}
              >
                <GripVertical
                  size={18}
                  className={cn(
                    "transition-colors",
                    isDragged ? "text-accent-text" : "text-faint"
                  )}
                />
              </div>

              {/* Emoji */}
              <span className="text-xl shrink-0">{cat.emoji}</span>

              {/* Label + slug */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {cat.label}
                </p>
                <p className="text-xs text-faint font-mono truncate">
                  {cat.slug}
                </p>
              </div>

              {/* Actions */}
              {!isDragActive && (
                <>
                  <button
                    onClick={() => setFormCategory(cat)}
                    className="w-10 h-10 flex items-center justify-center text-faint active:text-secondary"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTap(cat.id)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors",
                      pendingDeleteId === cat.id
                        ? "text-danger-text"
                        : "text-faint active:text-danger-text"
                    )}
                  >
                    <Trash2
                      size={16}
                      strokeWidth={pendingDeleteId === cat.id ? 2.5 : 1.8}
                    />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {localOrder.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-faint gap-3">
          <span className="text-3xl">🏷️</span>
          <p className="text-sm">No hay categorías</p>
          <button
            onClick={() => setFormCategory(null)}
            className="px-4 py-2 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover"
          >
            Crear la primera
          </button>
        </div>
      )}

      {formCategory !== undefined && (
        <CategoryForm
          category={formCategory}
          onClose={() => setFormCategory(undefined)}
        />
      )}
    </div>
  );
}
