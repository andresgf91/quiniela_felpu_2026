"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PartidosPage() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-white/60">Cargando...</p>;

  const total = matches?.length ?? 0;
  const live = matches?.filter((m: { status: string }) => m.status === "LIVE").length ?? 0;
  const finished = matches?.filter((m: { status: string }) => m.status === "FINISHED").length ?? 0;
  const predicted = matches?.filter((m: { prediction: unknown }) => m.prediction).length ?? 0;

  const byDate = new Map<string, typeof matches>();
  for (const m of matches ?? []) {
    const date = format(new Date(m.kickoffUtc), "yyyy-MM-dd");
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(m);
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: total },
          { label: "En vivo", value: live },
          { label: "Mis predicciones", value: predicted },
          { label: "Finalizados", value: finished },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold gold-text">{s.value}</div>
            <div className="text-xs text-white/60">{s.label}</div>
          </div>
        ))}
      </div>

      {[...byDate.entries()].map(([date, dayMatches]) => (
        <section key={date} className="mb-8">
          <h3 className="mb-3 text-lg font-semibold">
            {format(new Date(date), "EEEE d MMMM", { locale: es })}
          </h3>
          <div className="space-y-3">
            {dayMatches.map((m: {
              id: number;
              stage: string;
              groupCode: string | null;
              kickoffUtc: string;
              venue: string;
              homeTeam: { flagEmoji: string; nameEs: string } | null;
              awayTeam: { flagEmoji: string; nameEs: string } | null;
              homeScore: number | null;
              awayScore: number | null;
              prediction: { homeScore: number; awayScore: number; pointsAwarded: number | null } | null;
              locked: boolean;
              status: string;
            }) => (
              <div key={m.id} className="glass-card flex flex-wrap items-center gap-3 p-4">
                <div className="text-xs text-white/50">
                  {format(new Date(m.kickoffUtc), "HH:mm")}
                  {m.groupCode ? ` · Grupo ${m.groupCode}` : ` · ${m.stage}`}
                </div>
                <div className="flex flex-1 items-center justify-center gap-3">
                  <span>{m.homeTeam?.flagEmoji} {m.homeTeam?.nameEs ?? "TBD"}</span>
                  <span className="font-bold">
                    {m.status === "FINISHED"
                      ? `${m.homeScore} - ${m.awayScore}`
                      : m.prediction
                        ? `${m.prediction.homeScore} - ${m.prediction.awayScore}`
                        : "vs"}
                  </span>
                  <span>{m.awayTeam?.nameEs ?? "TBD"} {m.awayTeam?.flagEmoji}</span>
                </div>
                <div className="text-xs">
                  {!m.homeTeam && m.stage !== "GROUP" ? (
                    <span className="text-amber-400">Pendiente equipos</span>
                  ) : m.prediction ? (
                    <span className="text-green-400">
                      Predicho
                      {m.prediction.pointsAwarded != null &&
                        ` · ${m.prediction.pointsAwarded} pts`}
                    </span>
                  ) : m.locked ? (
                    <span className="text-white/40">Sin predicción</span>
                  ) : (
                    <span className="text-amber-400">Pendiente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
