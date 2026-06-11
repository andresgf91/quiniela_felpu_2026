"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const TABS = [
  { href: "/partidos", label: "Partidos" },
  { href: "/mis-predicciones", label: "Mis Predicciones" },
  { href: "/fases-finales", label: "Fases Finales" },
  { href: "/ranking", label: "Ranking" },
  { href: "/posiciones", label: "Posiciones" },
  { href: "/posiciones-predicciones", label: "Posiciones Predicciones" },
  { href: "/estadisticas", label: "Estadísticas" },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; isAdmin: boolean };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1628]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold gold-text">Quiniela WC 2026</h1>
            <p className="text-xs text-white/60">Hola, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-white/70 hover:text-white"
          >
            Salir
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                pathname === tab.href
                  ? "bg-[#d4af37] text-black"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          {user.isAdmin && (
            <Link
              href="/admin"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                pathname === "/admin"
                  ? "bg-red-500 text-white"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("unauthorized");
      return res.json() as Promise<{
        id: string;
        name: string;
        isAdmin: boolean;
      }>;
    },
  });
}
