"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Mode = "picks" | "simulation" | "real";

const STAGE_LABELS: Record<string, string> = {
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinales",
  THIRD: "3er puesto",
  FINAL: "Gran Final",
};

export default function FasesFinalesPage() {
  const [mode, setMode] = useState<Mode>("real");
  const queryClient = useQueryClient();

  const { data: realBracket } = useQuery({
    queryKey: ["bracket-real"],
    queryFn: async () => {
      const res = await fetch("/api/bracket/real");
      return res.json();
    },
  });

  const { data: picks } = useQuery({
    queryKey: ["bracket-picks"],
    queryFn: async () => {
      const res = await fetch("/api/bracket/picks");
      return res.json();
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      const matches = await res.json();
      const map = new Map();
      for (const m of matches) {
        if (m.homeTeam) map.set(m.homeTeam.id, m.homeTeam);
        if (m.awayTeam) map.set(m.awayTeam.id, m.awayTeam);
      }
      return [...map.values()];
    },
  });

  const savePick = useMutation({
    mutationFn: async ({ slot, teamId }: { slot: string; teamId: string }) => {
      const res = await fetch("/api/bracket-picks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: [{ slot, teamId }] }),
      });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bracket-picks"] }),
  });

  const byStage = (realBracket ?? []).reduce(
    (acc: Record<string, unknown[]>, m: { stage: string }) => {
      if (!acc[m.stage]) acc[m.stage] = [];
      acc[m.stage].push(m);
      return acc;
    },
    {},
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold gold-text">Fases Finales</h2>

      <div className="mb-6 flex gap-2">
        {(
          [
            ["picks", "Mi bracket"],
            ["simulation", "Mi simulación"],
            ["real", "Real"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              mode === key
                ? "bg-[#d4af37] text-black"
                : "bg-white/10 text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "picks" && (
        <div className="mb-6 glass-card p-4">
          <h3 className="mb-3 font-semibold">Campeón predicho</h3>
          <select
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            value={picks?.find((p: { slot: string }) => p.slot === "CHAMPION")?.teamId ?? ""}
            onChange={(e) =>
              savePick.mutate({ slot: "CHAMPION", teamId: e.target.value })
            }
          >
            <option value="">Seleccionar campeón</option>
            {teams?.map((t: { id: string; flagEmoji: string; nameEs: string }) => (
              <option key={t.id} value={t.id}>
                {t.flagEmoji} {t.nameEs}
              </option>
            ))}
          </select>
        </div>
      )}

      {Object.entries(STAGE_LABELS).map(([stage, label]) => (
        <section key={stage} className="mb-6">
          <h3 className="mb-3 text-lg font-semibold">{label}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(byStage[stage] ?? []).map((m: {
              id: number;
              homeTeam: { flagEmoji: string; nameEs: string } | null;
              awayTeam: { flagEmoji: string; nameEs: string } | null;
              homeScore: number | null;
              awayScore: number | null;
            }) => (
              <div key={m.id} className="glass-card p-4 text-sm">
                <div className="mb-1 text-xs text-white/50">#{m.id}</div>
                <div className="flex items-center justify-between">
                  <span>
                    {m.homeTeam?.flagEmoji} {m.homeTeam?.nameEs ?? "TBD"}
                  </span>
                  <span className="font-bold">
                    {m.homeScore != null ? `${m.homeScore}-${m.awayScore}` : "vs"}
                  </span>
                  <span>
                    {m.awayTeam?.nameEs ?? "TBD"} {m.awayTeam?.flagEmoji}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
