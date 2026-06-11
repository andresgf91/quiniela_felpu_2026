"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function RankingPage() {
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      return res.json();
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const res = await fetch("/api/activity");
      return res.json();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-xl font-bold gold-text">Ranking</h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="p-3">#</th>
                <th className="p-3">Jugador</th>
                <th className="p-3">Pts</th>
                <th className="p-3">Exactos</th>
                <th className="p-3">Efic.</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((row: {
                rank: number;
                name: string;
                totalPoints: number;
                exactHits: number;
                efficiency: number;
              }) => (
                <tr key={row.rank} className="border-b border-white/5">
                  <td className="p-3 font-bold gold-text">{row.rank}</td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3 font-semibold">{row.totalPoints}</td>
                  <td className="p-3">{row.exactHits}</td>
                  <td className="p-3">{row.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Actividad del Grupo</h3>
        <div className="glass-card space-y-3 p-4">
          {activity?.map((a: {
            id: string;
            userName: string;
            type: string;
            createdAt: string;
          }) => (
            <div key={a.id} className="text-sm">
              <span className="font-medium">{a.userName}</span>{" "}
              <span className="text-white/60">
                {a.type === "PREDICTIONS_UPDATED"
                  ? "actualizó sus predicciones"
                  : a.type === "RESULT_ENTERED"
                    ? "ingresó un resultado"
                    : a.type === "QUINIELA_RESET"
                      ? "borró su quiniela"
                      : "actualizó el bracket"}
              </span>
              <div className="text-xs text-white/40">
                {formatDistanceToNow(new Date(a.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
