"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [syncStatus, setSyncStatus] = useState<string>("");

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      return res.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      return res.json();
    },
  });

  async function saveResult() {
    if (!selectedMatch) return;
    const res = await fetch(`/api/admin/results/${selectedMatch}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: parseInt(homeScore, 10),
        awayScore: parseInt(awayScore, 10),
        status: "FINISHED",
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["matches"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    alert("Resultado guardado");
  }

  async function rescore() {
    await fetch("/api/admin/rescore", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    alert("Recálculo completado");
  }

  async function sync() {
    const res = await fetch("/api/admin/sync", { method: "POST" });
    const data = await res.json();
    setSyncStatus(
      `Última sync: ${data.synced} actualizados, ${data.errors?.length ?? 0} errores`,
    );
    queryClient.invalidateQueries({ queryKey: ["matches"] });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold gold-text">Panel Admin</h2>

      {syncStatus && (
        <p className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-200">
          {syncStatus}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={rescore}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Recalcular todo
        </button>
        <button
          onClick={sync}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Sincronizar resultados
        </button>
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-3 font-semibold">Ingresar resultado</h3>
        <select
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          value={selectedMatch ?? ""}
          onChange={(e) => setSelectedMatch(parseInt(e.target.value, 10))}
        >
          <option value="">Seleccionar partido</option>
          {matches?.map((m: { id: number; homeTeam: { nameEs: string } | null; awayTeam: { nameEs: string } | null }) => (
            <option key={m.id} value={m.id}>
              #{m.id} {m.homeTeam?.nameEs ?? "?"} vs {m.awayTeam?.nameEs ?? "?"}
            </option>
          ))}
        </select>
        <div className="mb-3 flex gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="input-score"
          />
          <span className="self-center">-</span>
          <input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="input-score"
          />
        </div>
        <button
          onClick={saveResult}
          className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-black"
        >
          Guardar resultado
        </button>
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-3 font-semibold">Usuarios</h3>
        <ul className="space-y-2 text-sm">
          {users?.map((u: {
            id: string;
            name: string;
            isAdmin: boolean;
            _count: { predictions: number; resets: number };
          }) => (
            <li key={u.id} className="flex justify-between border-b border-white/5 py-2">
              <span>
                {u.name} {u.isAdmin && "(admin)"}
              </span>
              <span className="text-white/50">
                {u._count.predictions} preds · {u._count.resets} resets
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
