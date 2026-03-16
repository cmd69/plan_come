"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full h-12 rounded-xl border border-danger-border text-danger-text font-medium text-base flex items-center justify-center gap-2 active:bg-danger-soft disabled:opacity-50 transition-colors"
    >
      <LogOut size={18} />
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
