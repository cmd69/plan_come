"use client";

import { useTransition, useRef, useEffect, useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { createDish, updateDish, type IngredientInput, type SideInput } from "@/actions/dishes";
import { DISH_TYPE_LABELS, DISH_TYPE_EMOJIS, DISH_TYPE_ORDER } from "@/lib/constants";
import type { Product, Category, DishType } from "@prisma/client";
import { cn } from "@/lib/utils";
import IngredientPicker from "./IngredientPicker";
import type { DishFull } from "./DishCard";

const GROUP_LABELS = ["A", "B", "C", "D", "E", "F"];
const GROUP_COLORS: Record<string, { bg: string; text: string; border: string; borderDashed: string; check: string }> = {
  A: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", borderDashed: "border-blue-300", check: "bg-blue-500" },
  B: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", borderDashed: "border-violet-300", check: "bg-violet-500" },
  C: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", borderDashed: "border-teal-300", check: "bg-teal-500" },
  D: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", borderDashed: "border-cyan-300", check: "bg-cyan-500" },
  E: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", borderDashed: "border-rose-300", check: "bg-rose-500" },
  F: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", borderDashed: "border-amber-300", check: "bg-amber-500" },
};

const TYPE_STYLES: Record<DishType, { active: string; inactive: string }> = {
  COMIDA: { active: "bg-yellow-100 border-yellow-400 text-yellow-800", inactive: "border-border-default text-muted" },
  CENA: { active: "bg-indigo-100 border-indigo-400 text-indigo-800", inactive: "border-border-default text-muted" },
  MIXTO: { active: "bg-emerald-100 border-emerald-400 text-emerald-800", inactive: "border-border-default text-muted" },
  ACOMPANANTE: { active: "bg-orange-100 border-orange-400 text-orange-800", inactive: "border-border-default text-muted" },
};

interface DishFormProps {
  dish?: DishFull | null;
  defaultType?: DishType;
  allDishes: DishFull[];
  products: Product[];
  categories: Category[];
  onClose: () => void;
}

export default function DishForm({ dish, defaultType, allDishes, products, categories, onClose }: DishFormProps) {
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [dishType, setDishType] = useState<DishType>(dish?.type ?? defaultType ?? "MIXTO");
  const [emoji, setEmoji] = useState(dish?.emoji ?? "");

  // Picker state: which context is requesting products
  const [pickerTarget, setPickerTarget] = useState<
    | { type: "base" }
    | { type: "optional" }
    | { type: "group"; group: string }
    | null
  >(null);

  // Ingredients state
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    dish?.ingredients.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      optional: i.optional,
      group: i.group,
      groupMin: i.groupMin,
    })) ?? []
  );

  // Sides state
  const [sides, setSides] = useState<SideInput[]>(
    dish?.sides.map((s) => ({ sideId: s.sideId, group: s.group, groupMin: s.groupMin })) ?? []
  );

  // Side picker
  const [sidePickerGroup, setSidePickerGroup] = useState<string | null>(null);

  // Available side dishes (type ACOMPANANTE)
  const availableSides = allDishes.filter((d) => d.type === "ACOMPANANTE" && d.id !== dish?.id);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // ── Derived data ──

  const baseIngredients = ingredients.filter((i) => !i.optional && !i.group);
  const optionalIngredients = ingredients.filter((i) => i.optional);
  const ingredientGroups = new Map<string, IngredientInput[]>();
  for (const ing of ingredients) {
    if (ing.group && !ing.optional) {
      const list = ingredientGroups.get(ing.group) ?? [];
      list.push(ing);
      ingredientGroups.set(ing.group, list);
    }
  }
  const usedIngredientGroups = [...ingredientGroups.keys()].sort();

  const sideGroups = new Map<string, SideInput[]>();
  for (const s of sides) {
    const g = s.group ?? "A";
    const list = sideGroups.get(g) ?? [];
    list.push(s);
    sideGroups.set(g, list);
  }
  const usedSideGroups = [...sideGroups.keys()].sort();

  // ── Helpers ──

  function getProduct(id: number) {
    return products.find((p) => p.id === id);
  }

  function nextGroupLabel(used: string[]): string | null {
    return GROUP_LABELS.find((l) => !used.includes(l)) ?? null;
  }

  function updateQuantity(productId: number, delta: number) {
    setIngredients((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  }

  function removeIngredient(productId: number) {
    setIngredients((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateGroupMin(group: string, delta: number, isSideGroup: boolean) {
    if (isSideGroup) {
      setSides((prev) =>
        prev.map((s) =>
          s.group === group
            ? { ...s, groupMin: Math.max(1, s.groupMin + delta) }
            : s
        )
      );
    } else {
      setIngredients((prev) =>
        prev.map((i) =>
          i.group === group
            ? { ...i, groupMin: Math.max(1, i.groupMin + delta) }
            : i
        )
      );
    }
  }

  function getGroupMin(group: string, isSideGroup: boolean): number {
    if (isSideGroup) {
      return sides.find((s) => s.group === group)?.groupMin ?? 1;
    }
    return ingredients.find((i) => i.group === group)?.groupMin ?? 1;
  }

  // ── Picker callbacks ──

  function handlePickerConfirm(productIds: number[]) {
    if (!pickerTarget) return;
    const target = pickerTarget;

    setIngredients((prev) => {
      let next = [...prev];

      if (target.type === "base") {
        next = next.filter((i) => i.group || i.optional || productIds.includes(i.productId));
        for (const pid of productIds) {
          if (!next.find((i) => i.productId === pid)) {
            next.push({ productId: pid, quantity: 1, optional: false, group: null, groupMin: 1 });
          }
        }
      } else if (target.type === "optional") {
        next = next.filter((i) => !i.optional || productIds.includes(i.productId));
        for (const pid of productIds) {
          if (!next.find((i) => i.productId === pid)) {
            next.push({ productId: pid, quantity: 1, optional: true, group: null, groupMin: 1 });
          }
        }
      } else if (target.type === "group") {
        const currentMin = next.find((i) => i.group === target.group)?.groupMin ?? 1;
        next = next.filter((i) => i.group !== target.group || productIds.includes(i.productId));
        for (const pid of productIds) {
          if (!next.find((i) => i.productId === pid)) {
            next.push({ productId: pid, quantity: 1, optional: false, group: target.group, groupMin: currentMin });
          }
        }
      }

      return next;
    });
  }

  function handleSidePickerConfirm(sideIds: number[]) {
    if (sidePickerGroup === null) return;
    const group = sidePickerGroup;

    setSides((prev) => {
      let next = [...prev];
      const currentMin = next.find((s) => s.group === group)?.groupMin ?? 1;
      next = next.filter((s) => s.group !== group || sideIds.includes(s.sideId));
      for (const sid of sideIds) {
        if (!next.find((s) => s.sideId === sid)) {
          next.push({ sideId: sid, group, groupMin: currentMin });
        }
      }
      return next;
    });
  }

  // ── Submit ──

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const data = {
        name: fd.get("name") as string,
        type: dishType,
        emoji: emoji || null,
        notes: (fd.get("notes") as string) || null,
        ingredients,
        sides: dishType !== "ACOMPANANTE" ? sides : [],
      };
      if (dish) {
        await updateDish(dish.id, data);
      } else {
        await createDish(data);
      }
      onClose();
    });
  }

  // ── Render helpers ──

  function renderIngredientChip(ing: IngredientInput, colorClass?: string) {
    const product = getProduct(ing.productId);
    if (!product) return null;
    return (
      <div
        key={ing.productId}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border",
          colorClass ?? "border-border-default bg-input-bg"
        )}
      >
        <span className="text-lg leading-none">{product.icon || "📦"}</span>
        <span className="flex-1 text-sm font-medium text-primary truncate">
          {product.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateQuantity(product.id, -1)}
            disabled={ing.quantity <= 1}
className="w-6 h-6 flex items-center justify-center rounded-full border border-border-strong text-tertiary disabled:opacity-30"
            >
              <Minus size={12} />
            </button>
            <span className="w-5 text-center text-xs font-bold tabular-nums">
              {ing.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-border-strong text-tertiary"
            >
            <Plus size={12} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeIngredient(product.id)}
          className="w-6 h-6 flex items-center justify-center text-dimmed active:text-danger-text"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // IDs for picker exclude
  function idsExcept(target: { type: string; group?: string }) {
    const exclude = new Set<number>();
    for (const ing of ingredients) {
      if (target.type === "base" && !ing.group && !ing.optional) continue;
      if (target.type === "optional" && ing.optional) continue;
      if (target.type === "group" && ing.group === (target as { group: string }).group) continue;
      exclude.add(ing.productId);
    }
    return exclude;
  }

  function selectedIdsFor(target: { type: string; group?: string }): Set<number> {
    if (target.type === "base") return new Set(baseIngredients.map((i) => i.productId));
    if (target.type === "optional") return new Set(optionalIngredients.map((i) => i.productId));
    if (target.type === "group") {
      const g = (target as { group: string }).group;
      return new Set((ingredientGroups.get(g) ?? []).map((i) => i.productId));
    }
    return new Set();
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[60] max-h-[90vh] flex flex-col sheet-popup">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-semibold text-primary">
            {dish ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-faint">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-8 flex flex-col gap-5 overflow-y-auto">
          {/* Nombre + Emoji */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-secondary">Nombre</label>
              <input
                ref={firstInputRef}
                name="name"
                type="text"
                defaultValue={dish?.name ?? ""}
                required
                placeholder="Ej: Pollo al horno"
                className="h-12 px-3 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-16">
              <label className="text-sm font-medium text-secondary">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🍽️"
                className="h-12 px-1 rounded-xl border border-border-default bg-input-bg text-2xl text-center outline-none focus:border-accent focus:bg-input-focus transition-colors"
              />
            </div>
          </div>

          {/* Tipo de plato */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {DISH_TYPE_ORDER.map((t) => {
                const isActive = dishType === t;
                const styles = TYPE_STYLES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDishType(t)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors",
                      isActive ? styles.active : styles.inactive
                    )}
                  >
                    <span className="text-lg leading-none">{DISH_TYPE_EMOJIS[t]}</span>
                    <span>{DISH_TYPE_LABELS[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════ INGREDIENTES ══════ */}

          {/* Base (obligatorios) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Obligatorios</label>
              <button
                type="button"
                onClick={() => setPickerTarget({ type: "base" })}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-soft text-accent-text active:bg-accent-muted"
              >
                <Plus size={14} />
              </button>
            </div>
            {baseIngredients.map((ing) => renderIngredientChip(ing, "border-accent-muted bg-accent-soft/50"))}
          </div>

          {/* Opcionales */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                Opcionales
                <span className="text-faint font-normal text-xs">(no afectan disponibilidad)</span>
              </label>
              <button
                type="button"
                onClick={() => setPickerTarget({ type: "optional" })}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 active:bg-amber-200"
              >
                <Plus size={14} />
              </button>
            </div>
            {optionalIngredients.map((ing) => renderIngredientChip(ing, "border-amber-200 bg-amber-50/50"))}
          </div>

          {/* Ingredient groups */}
          {usedIngredientGroups.map((groupName) => {
            const members = ingredientGroups.get(groupName) ?? [];
            const colors = GROUP_COLORS[groupName];
            const min = getGroupMin(groupName, false);
            return (
              <div key={groupName} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", colors?.bg, colors?.text)}>
                    Grupo {groupName}
                  </span>
                  <span className="text-xs text-faint">mín.</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateGroupMin(groupName, -1, false)}
                      disabled={min <= 1}
                      className="w-5 h-5 flex items-center justify-center rounded-full border border-border-strong text-tertiary disabled:opacity-30"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-4 text-center text-xs font-bold tabular-nums">{min}</span>
                    <button
                      type="button"
                      onClick={() => updateGroupMin(groupName, 1, false)}
                      disabled={min >= members.length}
                      className="w-5 h-5 flex items-center justify-center rounded-full border border-border-strong text-tertiary disabled:opacity-30"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-xs text-faint">de {members.length}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ type: "group", group: groupName })}
                    className={cn("w-7 h-7 flex items-center justify-center rounded-full", colors?.bg, colors?.text, "active:opacity-70")}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {members.map((ing) =>
                  renderIngredientChip(ing, `${colors?.border} ${colors?.bg}/50`)
                )}
              </div>
            );
          })}

          {/* Add new ingredient group */}
          {(() => {
            const nextGroup = nextGroupLabel(usedIngredientGroups);
            if (!nextGroup) return null;
            const colors = GROUP_COLORS[nextGroup];
            return (
              <button
                type="button"
                onClick={() => setPickerTarget({ type: "group", group: nextGroup })}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors active:opacity-70",
                  colors?.borderDashed, colors?.text
                )}
              >
                <Plus size={14} />
                Nuevo grupo de alternativas ({nextGroup})
              </button>
            );
          })()}

          {/* ══════ ACOMPAÑANTES ══════ */}
          {dishType !== "ACOMPANANTE" && availableSides.length > 0 && (
            <>
              <div className="border-t border-border-subtle pt-4 flex flex-col gap-3">
                <label className="text-sm font-bold text-secondary">Acompañantes</label>

                {/* Side groups */}
                {usedSideGroups.map((groupName) => {
                  const members = sideGroups.get(groupName) ?? [];
                  const colors = GROUP_COLORS[groupName];
                  const min = getGroupMin(groupName, true);
                  return (
                    <div key={groupName} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", colors?.bg, colors?.text)}>
                          Grupo {groupName}
                        </span>
                        <span className="text-xs text-faint">mín.</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateGroupMin(groupName, -1, true)}
                            disabled={min <= 1}
                            className="w-5 h-5 flex items-center justify-center rounded-full border border-border-strong text-tertiary disabled:opacity-30"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-4 text-center text-xs font-bold tabular-nums">{min}</span>
                          <button
                            type="button"
                            onClick={() => updateGroupMin(groupName, 1, true)}
                            disabled={min >= members.length}
                            className="w-5 h-5 flex items-center justify-center rounded-full border border-border-strong text-tertiary disabled:opacity-30"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-xs text-faint">de {members.length}</span>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() => setSidePickerGroup(groupName)}
                          className={cn("w-7 h-7 flex items-center justify-center rounded-full", colors?.bg, colors?.text, "active:opacity-70")}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {members.map((s) => {
                        const sideDish = availableSides.find((d) => d.id === s.sideId);
                        if (!sideDish) return null;
                        return (
                          <div key={s.sideId} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", colors?.border, `${colors?.bg}/50`)}>
                            <span className="text-lg leading-none">{sideDish.emoji || "🥗"}</span>
                            <span className="flex-1 text-sm font-medium text-primary truncate">{sideDish.name}</span>
                            <button
                              type="button"
                              onClick={() => setSides((prev) => prev.filter((x) => x.sideId !== s.sideId))}
                              className="w-6 h-6 flex items-center justify-center text-dimmed active:text-danger-text"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* New side group button */}
                {(() => {
                  const nextGroup = nextGroupLabel(usedSideGroups);
                  if (!nextGroup) return null;
                  const colors = GROUP_COLORS[nextGroup];
                  return (
                    <button
                      type="button"
                      onClick={() => setSidePickerGroup(nextGroup)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors active:opacity-70",
                        colors?.borderDashed, colors?.text
                      )}
                    >
                      <Plus size={14} />
                      Nuevo grupo de acompañantes ({nextGroup})
                    </button>
                  );
                })()}
              </div>
            </>
          )}

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">
              Notas <span className="text-faint font-normal">(opcional)</span>
            </label>
            <textarea
              name="notes"
              defaultValue={dish?.notes ?? ""}
              placeholder="Ej: Marinar 30 min antes, servir con ensalada…"
              rows={2}
              className="px-3 py-2.5 rounded-xl border border-border-default bg-input-bg text-base outline-none focus:border-accent focus:bg-input-focus transition-colors resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
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

      {/* Ingredient Picker */}
      {pickerTarget && (
        <IngredientPicker
          products={products}
          categories={categories}
          selectedIds={selectedIdsFor(pickerTarget)}
          excludeIds={idsExcept(pickerTarget)}
          onConfirm={(ids) => handlePickerConfirm(ids)}
          onClose={() => setPickerTarget(null)}
          title={
            pickerTarget.type === "base" ? "Obligatorios"
            : pickerTarget.type === "optional" ? "Opcionales"
            : `Grupo ${pickerTarget.group}`
          }
          accentColor={
            pickerTarget.type === "base"
              ? { border: "border-accent", bg: "bg-accent-soft", text: "text-accent-text", check: "bg-accent" }
              : pickerTarget.type === "optional"
                ? { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700", check: "bg-amber-500" }
                : (() => {
                    const c = GROUP_COLORS[pickerTarget.group];
                    return c ? { border: c.border.replace("-200", "-500"), bg: c.bg, text: c.text, check: c.check } : undefined;
                  })()
          }
        />
      )}

      {/* Side Picker */}
      {sidePickerGroup !== null && (
        <>
          <div className="fixed inset-0 bg-overlay z-[70]" onClick={() => setSidePickerGroup(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-elevated rounded-t-2xl z-[80] max-h-[70vh] flex flex-col sheet-popup">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-primary">
                Acompañantes — Grupo {sidePickerGroup}
              </h2>
              <button onClick={() => setSidePickerGroup(null)} className="w-9 h-9 flex items-center justify-center text-faint">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {availableSides.map((sideDish) => {
                const group = sidePickerGroup;
                const isSelected = sides.some((s) => s.sideId === sideDish.id && s.group === group);
                const isUsedElsewhere = sides.some((s) => s.sideId === sideDish.id && s.group !== group);
                if (isUsedElsewhere) return null;
                const colors = GROUP_COLORS[group!];
                return (
                  <button
                    key={sideDish.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSides((prev) => prev.filter((s) => !(s.sideId === sideDish.id && s.group === group)));
                      } else {
                        setSides((prev) => [...prev, { sideId: sideDish.id, group, groupMin: 1 }]);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-colors text-left",
                      isSelected
                        ? `${colors?.border} ${colors?.bg}`
                        : "border-border-default bg-surface active:bg-surface-alt"
                    )}
                  >
                    <span className="text-xl">{sideDish.emoji || "🥗"}</span>
                    <span className={cn("flex-1 text-sm font-medium", isSelected ? "text-primary" : "text-tertiary")}>
                      {sideDish.name}
                    </span>
                    {isSelected && (
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-xs", colors?.check)}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 border-t border-border-subtle px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  handleSidePickerConfirm(
                    sides
                      .filter((s) => s.group === sidePickerGroup)
                      .map((s) => s.sideId)
                  );
                  setSidePickerGroup(null);
                }}
                className="w-full py-2.5 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover"
              >
                Confirmar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
