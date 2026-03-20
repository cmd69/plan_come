"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Package, ChefHat, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/plan", label: "Plan", Icon: CalendarDays },
  { href: "/inventario", label: "Inventario", Icon: Package },
  { href: "/platos", label: "Platos", Icon: ChefHat },
  { href: "/compra", label: "Compra", Icon: ShoppingCart },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border-default flex z-50 md:sticky md:top-0 md:bottom-auto md:h-12 md:border-t-0 md:border-b md:z-40 md:px-2 md:gap-1">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
              "md:flex-row md:gap-2 md:text-sm md:rounded-lg md:py-1.5 md:px-3",
              isActive
                ? "text-accent-text md:bg-accent-soft"
                : "text-faint hover:text-secondary md:hover:bg-pressed"
            )}
          >
            <Icon size={20} className="md:hidden" strokeWidth={isActive ? 2.5 : 1.8} />
            <Icon size={16} className="hidden md:block" strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={cn("font-medium", isActive && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
