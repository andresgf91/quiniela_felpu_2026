"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("1991");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("1991");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode, name, pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al registrarse");
      return;
    }
    router.push("/mis-predicciones");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold gold-text">Unirse a la quiniela</h1>
        <p className="mb-6 text-sm text-white/60">
          Elige el <strong className="text-white">nombre que quieras</strong> (debe ser único en el
          grupo). PIN y código de invitación: <strong className="gold-text">1991</strong>
        </p>
        {error && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-white/70">Código de invitación</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            required
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-white/70">Tu nombre (como quieras que te vean)</span>
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
          {loading ? "Registrando..." : "Registrarme"}
        </button>
        <p className="mt-4 text-center text-sm text-white/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="gold-text underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
