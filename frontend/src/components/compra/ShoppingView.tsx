"use client";

import { useState } from "react";
import type { Product, Category, ShoppingSession, ShoppingSessionItem } from "@prisma/client";
import ShoppingPrepare from "./ShoppingPrepare";
import ShoppingMode from "./ShoppingMode";

type SessionWithItems = ShoppingSession & {
  items: (ShoppingSessionItem & { product: Product })[];
};

interface ShoppingViewProps {
  products: Product[];
  categories: Category[];
  activeSession: SessionWithItems | null;
}

export default function ShoppingView({
  products,
  categories,
  activeSession,
}: ShoppingViewProps) {
  const [addingMore, setAddingMore] = useState(false);

  if (activeSession && !addingMore) {
    return (
      <ShoppingMode
        session={activeSession}
        categories={categories}
        onAddMore={() => setAddingMore(true)}
      />
    );
  }

  if (activeSession && addingMore) {
    const existingProductIds = new Set(activeSession.items.map((i) => i.productId));
    return (
      <ShoppingPrepare
        products={products}
        categories={categories}
        sessionId={activeSession.id}
        existingProductIds={existingProductIds}
        onBack={() => setAddingMore(false)}
      />
    );
  }

  return (
    <ShoppingPrepare
      products={products}
      categories={categories}
    />
  );
}
