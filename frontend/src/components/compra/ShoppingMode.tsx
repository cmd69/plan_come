"use client";

import { useState, useMemo, useTransition } from "react";
import { Check, Plus, Minus, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category, ShoppingSession, ShoppingSessionItem } from "@prisma/client";
import { buildCategoryMaps, PRIORITY_ICONS, PRIORITY_COLORS } from "@/lib/constants";
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
          if (a.product.priority !== b.product.priority) return b.product.priority - a.product.priority;
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
      <header className="sticky top-0 md:top-12 bg-surface border-b border-border-default z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-accent-text" />
            <h1 className="text-xl font-bold text-primary">Compra</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-tertiary">
              {checkedCount}/{totalCount}
            </span>
            <button
              onClick={onAddMore}
              className="w-8 h-8 flex items-center justify-center text-muted bg-pressed rounded-lg active:bg-pressed-strong"
              title="Añadir productos"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-8 h-8 flex items-center justify-center text-faint active:text-tertiary"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-pressed">
          <div
            className="h-full bg-accent transition-all duration-300"
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
                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-surface-alt border-b border-border-subtle flex items-center gap-1.5",
                allChecked ? "text-faint" : "text-tertiary"
              )}>
                <span>{emoji}</span>
                <span className="flex-1">{label}</span>
                <span className="text-faint normal-case font-normal tracking-normal">
                  {catChecked}/{items.length}
                </span>
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 md:py-2.5 border-b border-surface-alt transition-colors",
                    item.checked && "bg-surface-alt/50"
                  )}
                >
                  {/* Check button */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      item.checked
                        ? "bg-accent border-accent text-inverted"
                        : "border-border-strong active:border-accent"
                    )}
                  >
                    {item.checked && <Check size={16} strokeWidth={3} />}
                  </button>

                  {/* Priority indicator */}
                  {item.product.priority > 0 && !item.checked && (
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wide shrink-0",
                      PRIORITY_COLORS[item.product.priority]
                    )}>
                      {PRIORITY_ICONS[item.product.priority]}
                    </span>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-base font-medium",
                        item.checked
                          ? "text-faint line-through"
                          : "text-primary"
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
                            ? "border-border-default text-dimmed"
                            : "border-border-strong text-secondary active:bg-pressed"
                        )}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums text-primary">
                        {item.quantityToBuy}
                      </span>
                      <button
                        onClick={() => handleQuantity(item.id, 1, item.quantityToBuy)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-border-strong text-secondary active:bg-pressed"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold tabular-nums text-faint px-1">
                      x{item.quantityToBuy}
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
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-surface via-surface to-surface/0 z-30">
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="w-full h-14 rounded-2xl bg-accent shadow-lg flex items-center justify-center gap-2 text-inverted font-semibold text-base active:bg-accent-hover"
          >
            <Check size={20} />
            Finalizar compra
          </button>
        </div>
      )}

      {/* Finish confirm modal */}
      {showFinishConfirm && (
        <>
          <div className="fixed inset-0 bg-overlay z-[70]" onClick={() => setShowFinishConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[80] px-4 pt-6 pb-8 sheet-popup-confirm">
            <p className="text-base font-semibold text-primary text-center mb-2">
              Finalizar compra
            </p>
            <p className="text-sm text-muted text-center mb-1">
              {checkedCount} de {totalCount} productos marcados.
            </p>
            <p className="text-sm text-muted text-center mb-6">
              Se actualizará el inventario con los productos comprados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={handleFinish}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-inverted",
                  isPending ? "bg-accent/70" : "bg-accent active:bg-accent-hover"
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
          <div className="fixed inset-0 bg-overlay z-[70]" onClick={() => setShowCancelConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[80] px-4 pt-6 pb-8 sheet-popup-confirm">
            <p className="text-base font-semibold text-primary text-center mb-2">
              Descartar lista
            </p>
            <p className="text-sm text-muted text-center mb-6">
              Se descartará la lista de la compra actual. El inventario no se modificará.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-surface-alt"
              >
                Volver
              </button>
              <button
                disabled={isPending}
                onClick={handleCancel}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-inverted",
                  isPending ? "bg-danger/70" : "bg-danger active:bg-danger-hover"
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
