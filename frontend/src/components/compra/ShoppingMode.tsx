"use client";

import { useState, useMemo, useTransition } from "react";
import { Check, Plus, Minus, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category, ShoppingSession, ShoppingSessionItem } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";
import { toggleItem, updateItemQuantity, completeSession, cancelSession } from "@/actions/shopping";

type SessionWithItems = ShoppingSession & {
  items: (ShoppingSessionItem & { product: Product })[];
};

interface ShoppingModeProps {
  session: SessionWithItems;
  categories: Category[];
  onAddMore: () => void;
}

export default function ShoppingMode({ session, categories, onAddMore }: ShoppingModeProps) {
  const [, startTransition] = useTransition();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPending, startFinish] = useTransition();

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  const checkedCount = session.items.filter((i) => i.checked).length;
  const totalCount = session.items.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const grouped = useMemo(() => {
    const catMap = new Map<string, (ShoppingSessionItem & { product: Product })[]>();
    for (const item of session.items) {
      const cat = item.product.category;
      const list = catMap.get(cat) ?? [];
      list.push(item);
      catMap.set(cat, list);
    }

    return order
      .filter((slug) => catMap.has(slug))
      .map((slug) => ({
        slug,
        label: labels[slug] ?? slug,
        emoji: emojis[slug] ?? "📦",
        items: catMap.get(slug)!.sort((a, b) => {
          if (a.checked !== b.checked) return a.checked ? 1 : -1;
          return a.product.name.localeCompare(b.product.name, "es");
        }),
      }));
  }, [session.items, order, labels, emojis]);

  function handleToggle(itemId: number) {
    startTransition(() => toggleItem(itemId));
  }

  function handleQuantity(itemId: number, delta: number, current: number) {
    const next = current + delta;
    if (next < 1) return;
    startTransition(() => updateItemQuantity(itemId, next));
  }

  function handleFinish() {
    startFinish(async () => {
      await completeSession(session.id);
    });
  }

  function handleCancel() {
    startFinish(async () => {
      await cancelSession(session.id);
    });
  }

  return (
    <>
      {/* Header with progress */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-emerald-600" />
            <h1 className="text-xl font-bold text-gray-900">Compra</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-gray-600">
              {checkedCount}/{totalCount}
            </span>
            <button
              onClick={onAddMore}
              className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg active:bg-gray-200"
              title="Añadir productos"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Items grouped by category */}
      <div className="pb-24">
        {grouped.map(({ slug, label, emoji, items }) => {
          const catChecked = items.filter((i) => i.checked).length;
          const allChecked = catChecked === items.length;
          return (
            <section key={slug}>
              <div className={cn(
                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5",
                allChecked ? "text-gray-400" : "text-gray-600"
              )}>
                <span>{emoji}</span>
                <span className="flex-1">{label}</span>
                <span className="text-gray-400 normal-case font-normal tracking-normal">
                  {catChecked}/{items.length}
                </span>
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-colors",
                    item.checked && "bg-gray-50/50"
                  )}
                >
                  {/* Check button */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      item.checked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 active:border-emerald-400"
                    )}
                  >
                    {item.checked && <Check size={16} strokeWidth={3} />}
                  </button>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-base font-medium",
                        item.checked
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      )}
                    >
                      {item.product.icon && `${item.product.icon} `}
                      {item.product.name}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  {!item.checked ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleQuantity(item.id, -1, item.quantityToBuy)}
                        disabled={item.quantityToBuy <= 1}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-full border",
                          item.quantityToBuy <= 1
                            ? "border-gray-200 text-gray-300"
                            : "border-gray-300 text-gray-700 active:bg-gray-100"
                        )}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums text-gray-900">
                        {item.quantityToBuy}
                      </span>
                      <button
                        onClick={() => handleQuantity(item.id, 1, item.quantityToBuy)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 active:bg-gray-100"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold tabular-nums text-gray-400 px-1">
                      ×{item.quantityToBuy}
                    </span>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>

      {/* Finish button */}
      {checkedCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-white/0 z-30">
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="w-full h-14 rounded-2xl bg-emerald-600 shadow-lg flex items-center justify-center gap-2 text-white font-semibold text-base active:bg-emerald-700"
          >
            <Check size={20} />
            Finalizar compra
          </button>
        </div>
      )}

      {/* Finish confirm modal */}
      {showFinishConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[70]" onClick={() => setShowFinishConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] px-4 pt-6 pb-8">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Finalizar compra
            </p>
            <p className="text-sm text-gray-500 text-center mb-1">
              {checkedCount} de {totalCount} productos marcados.
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Se actualizará el inventario con los productos comprados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-medium text-base active:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={handleFinish}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-white",
                  isPending ? "bg-emerald-400" : "bg-emerald-600 active:bg-emerald-700"
                )}
              >
                {isPending ? "Actualizando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[70]" onClick={() => setShowCancelConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] px-4 pt-6 pb-8">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Descartar lista
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Se descartará la lista de la compra actual. El inventario no se modificará.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-medium text-base active:bg-gray-50"
              >
                Volver
              </button>
              <button
                disabled={isPending}
                onClick={handleCancel}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-white",
                  isPending ? "bg-red-400" : "bg-red-600 active:bg-red-700"
                )}
              >
                {isPending ? "Descartando…" : "Descartar"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
