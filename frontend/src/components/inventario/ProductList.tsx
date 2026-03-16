"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { Plus, ChevronDown, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp10, SmilePlus, Smile, List, LayoutGrid, RotateCcw, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";
import { buildCategoryMaps } from "@/lib/constants";
import ProductCard from "./ProductCard";
import ProductForm from "./ProductForm";
import BulkEditForm from "./BulkEditForm";
import ImportProducts from "./ImportProducts";
import ProductGrid from "./ProductGrid";
import { resetAllUnits } from "@/actions/products";
import { useModalHistory } from "@/lib/useModalHistory";

type SortKey = "alpha" | "icon" | "units";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "grid";

const SORT_OPTIONS: { key: SortKey; label: string; iconAsc: typeof ArrowDownAZ; iconDesc: typeof ArrowUpAZ }[] = [
  { key: "alpha", label: "Nombre", iconAsc: ArrowDownAZ, iconDesc: ArrowUpAZ },
  { key: "icon", label: "Icono", iconAsc: SmilePlus, iconDesc: Smile },
  { key: "units", label: "Cantidad", iconAsc: ArrowDown01, iconDesc: ArrowUp10 },
];

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  const sorted = [...products].sort((a, b) => {
    // Primary: priority desc (alta first)
    if (a.priority !== b.priority) return b.priority - a.priority;
    // Secondary: selected sort key
    switch (key) {
      case "alpha":
        return a.name.localeCompare(b.name, "es");
      case "icon":
        return (a.icon ?? "").localeCompare(b.icon ?? "");
      case "units":
        return a.units - b.units;
    }
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

interface ProductListProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}

export default function ProductList({ products, categories, initialCategory }: ProductListProps) {
  const [formProduct, setFormProduct] = useState<Product | null | undefined>(undefined);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Selection mode
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const selectionMode = selected.size > 0;

  const dismissForm = useCallback(() => {
    setFormProduct(undefined);
    setDefaultCategory(undefined);
  }, []);

  const closeForm = useModalHistory(formProduct !== undefined, dismissForm);

  const dismissBulkEdit = useCallback(() => {
    setShowBulkEdit(false);
    setSelected(new Set());
  }, []);

  const closeBulkEdit = useModalHistory(showBulkEdit, dismissBulkEdit);

  const { labels, emojis, order } = useMemo(
    () => buildCategoryMaps(categories),
    [categories]
  );

  function toggleSection(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  function handleSortSelect(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setShowSortMenu(false);
  }

  const handleLongPress = useCallback((id: number) => {
    setSelected(new Set([id]));
  }, []);

  const handleToggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const grouped = useMemo(
    () =>
      order.map((slug) => ({
        slug,
        label: labels[slug] ?? slug,
        emoji: emojis[slug] ?? "📦",
        products: sortProducts(
          products.filter((p) => p.category === slug),
          sortKey,
          sortDir
        ),
      })).filter((g) => g.products.length > 0),
    [products, sortKey, sortDir, order, labels, emojis]
  );

  const isEmpty = products.length === 0;
  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey)!;
  const CurrentIcon = sortDir === "asc" ? currentSort.iconAsc : currentSort.iconDesc;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 bg-surface border-b border-border-default px-4 py-4 z-10 flex items-center justify-between">
        {selectionMode ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="w-8 h-8 flex items-center justify-center text-muted active:bg-pressed rounded-lg"
              >
                <X size={18} />
              </button>
              <span className="text-base font-semibold text-primary">
                {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => setShowBulkEdit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-text bg-accent-soft rounded-lg active:bg-accent-muted"
            >
              <Pencil size={14} />
              Editar
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-primary">
              <span className="mr-1.5">📦</span>Inventario
            </h1>
            {!isEmpty && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center w-8 h-8 text-muted bg-pressed rounded-lg active:bg-pressed-strong"
                  title="Poner todo a 0"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
                  className="flex items-center justify-center w-8 h-8 text-muted bg-pressed rounded-lg active:bg-pressed-strong"
                  title={viewMode === "list" ? "Vista cuadrícula" : "Vista lista"}
                >
                  {viewMode === "list" ? <LayoutGrid size={15} /> : <List size={15} />}
                </button>

                {viewMode === "list" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-tertiary bg-pressed rounded-lg active:bg-pressed-strong"
                    >
                      <CurrentIcon size={14} />
                      {currentSort.label}
                    </button>

                    {showSortMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setShowSortMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-surface border border-border-default rounded-xl shadow-lg z-30 min-w-[160px] py-1">
                          {SORT_OPTIONS.map((opt) => {
                            const isActive = opt.key === sortKey;
                            const Icon = isActive
                              ? sortDir === "asc"
                                ? opt.iconAsc
                                : opt.iconDesc
                              : opt.iconAsc;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleSortSelect(opt.key)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm active:bg-pressed",
                                  isActive
                                    ? "text-accent-text font-medium"
                                    : "text-secondary"
                                )}
                              >
                                <Icon size={16} />
                                <span className="flex-1 text-left">{opt.label}</span>
                                {isActive && (
                                  <span className="text-xs text-faint">
                                    {sortDir === "asc" ? "A-Z" : "Z-A"}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-faint gap-5">
          <span className="text-4xl">📦</span>
          <p className="text-base">No hay productos todavía</p>
          <button
            onClick={() => setFormProduct(null)}
            className="px-5 py-2.5 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover"
          >
            Añadir el primero
          </button>
          <div className="w-full border-t border-border-subtle pt-4">
            <p className="text-sm text-faint text-center mb-3">
              o importa muchos a la vez
            </p>
            <ImportProducts />
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <ProductGrid
          products={products}
          categories={categories}
          initialCategory={initialCategory}
          onEdit={(p) => setFormProduct(p)}
          onAdd={(cat) => { setDefaultCategory(cat); setFormProduct(null); }}
        />
      ) : (
        <div>
          {grouped.map(({ slug, label, emoji, products: groupProducts }) => {
            const isCollapsed = collapsed.has(slug);
            return (
              <section key={slug}>
                <button
                  onClick={() => toggleSection(slug)}
                  className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-tertiary bg-surface-alt border-b border-border-subtle flex items-center gap-1.5 active:bg-pressed"
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200 shrink-0",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  <span>{emoji}</span>
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-faint normal-case font-normal tracking-normal">
                    {groupProducts.length}
                  </span>
                </button>
                {!isCollapsed &&
                  groupProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={(p) => setFormProduct(p)}
                      selectionMode={selectionMode}
                      isSelected={selected.has(product.id)}
                      onLongPress={handleLongPress}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
              </section>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {!isEmpty && !selectionMode && (
        <button
          onClick={() => setFormProduct(null)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-inverted rounded-full shadow-lg flex items-center justify-center active:bg-accent-hover transition-colors z-30"
          aria-label="Añadir producto"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Product Form Modal */}
      {formProduct !== undefined && (
        <ProductForm
          product={formProduct}
          categories={categories}
          defaultCategory={defaultCategory}
          onClose={closeForm}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditForm
          selectedIds={[...selected]}
          categories={categories}
          onClose={closeBulkEdit}
        />
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <>
          <div className="fixed inset-0 bg-overlay z-[70]" onClick={() => setShowResetConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[80] px-4 pt-6 pb-8">
            <p className="text-base font-semibold text-primary text-center mb-2">
              Poner todo a 0
            </p>
            <p className="text-sm text-muted text-center mb-6">
              Se pondrán las unidades de todos los productos a 0
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-border-default text-tertiary font-medium text-base active:bg-pressed"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await resetAllUnits();
                    setShowResetConfirm(false);
                  });
                }}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-base text-inverted",
                  isPending ? "bg-danger/70" : "bg-danger active:bg-danger-hover"
                )}
              >
                {isPending ? "Reseteando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
