"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });

      if (!res.ok) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      router.push("/plan");
      router.refresh();
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">PlanCome</h1>
          <p className="text-sm text-muted mt-1">Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-secondary mb-1">
              Usuario
            </label>
            <input
              id="user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              autoComplete="username"
              className="w-full h-12 px-4 rounded-xl border border-border-strong bg-input-bg text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-input-focus"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-xl border border-border-strong bg-input-bg text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-input-focus"
            />
          </div>

          {error && (
            <p className="text-sm text-danger-text text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-accent text-inverted font-semibold text-base active:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
