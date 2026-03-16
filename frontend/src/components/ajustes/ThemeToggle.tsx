"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-border-default active:bg-pressed transition-colors"
    >
      <div className="flex items-center gap-3">
        {isDark ? <Moon size={18} className="text-accent-text" /> : <Sun size={18} className="text-accent-text" />}
        <span className="text-base font-medium text-primary">Modo oscuro</span>
      </div>
      <div
        className={`w-11 h-6 rounded-full relative transition-colors ${
          isDark ? "bg-accent" : "bg-dimmed"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-inverted shadow transition-transform ${
            isDark ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
