"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("1991");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al iniciar sesión");
      return;
    }
    router.push("/partidos");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold gold-text">Quiniela WC 2026</h1>
        <p className="mb-6 text-sm text-white/60">
          Usa <strong className="text-white">tu propio nombre</strong> (el que elegiste al
          registrarte) y el PIN del grupo: <strong className="gold-text">1991</strong>
        </p>
        {error && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-white/70">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            required
          />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-white/70">PIN (4-6 dígitos)</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#d4af37] py-2.5 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="mt-4 text-center text-sm text-white/60">
          ¿Primera vez?{" "}
          <Link href="/register" className="gold-text underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
