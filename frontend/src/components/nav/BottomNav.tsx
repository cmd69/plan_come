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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex z-50">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
              isActive ? "text-emerald-600" : "text-gray-400"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={cn("font-medium", isActive && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
