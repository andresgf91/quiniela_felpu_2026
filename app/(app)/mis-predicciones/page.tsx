"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { PredictionCard } from "@/components/PredictionCard";

export default function MisPrediccionesPage() {
  const queryClient = useQueryClient();
  const focusIndex = useRef(0);

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const groupMatches =
    matches?.filter((m: { stage: string }) => m.stage === "GROUP") ?? [];
  const predicted = groupMatches.filter(
    (m: { prediction: unknown }) => m.prediction,
  ).length;

  async function handleBorrar() {
    if (
      !confirm(
        "¿Borrar todas tus predicciones abiertas? Solo puedes hacerlo 2 veces.",
      )
    )
      return;
    const res = await fetch("/api/predictions", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["matches"] });
    alert(`Se borraron ${data.deleted} predicciones. Quedan ${data.resetsRemaining} usos.`);
  }

  if (isLoading) {
    return <p className="text-white/60">Cargando partidos...</p>;
  }

  return (
    <div>
      <div className="mb-6 glass-card p-4">
        <h2 className="mb-2 text-xl font-bold gold-text">Mis Predicciones</h2>
        <p className="mb-3 text-sm text-white/70">
          Exacto: 5 pts · Ganador+diff: 3 pts · Ganador: 2 pts · Fallo: 0 pts
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm font-medium text-[#d4af37]">
            Predicciones guardadas: {predicted}/{groupMatches.length}
          </span>
          <button
            onClick={handleBorrar}
            className="rounded-lg border border-red-500/40 px-3 py-1 text-sm text-red-300 hover:bg-red-500/10"
          >
            Borrar Quiniela
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groupMatches.map((match: Parameters<typeof PredictionCard>[0]["match"], i: number) => (
          <PredictionCard
            key={match.id}
            match={match}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["matches"] })}
            onAdvance={() => {
              focusIndex.current = i + 1;
            }}
          />
        ))}
      </div>
    </div>
  );
}
