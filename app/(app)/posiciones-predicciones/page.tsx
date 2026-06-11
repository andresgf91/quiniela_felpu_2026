"use client";

import { useQuery } from "@tanstack/react-query";

const GROUPS = "ABCDEFGHIJKL".split("");

export default function PosicionesPrediccionesPage() {
  const { data } = useQuery({
    queryKey: ["standings-predicted"],
    queryFn: async () => {
      const res = await fetch("/api/standings/predicted");
      return res.json();
    },
  });

  const tables = data?.tables ?? {};
  const stats = data?.stats;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold gold-text">Posiciones Predicciones</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="glass-card p-4 text-center">
          <div className="text-xl font-bold gold-text">
            {stats?.groupPredictions ?? 0}/72
          </div>
          <div className="text-xs text-white/60">Grupos predichos</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((code) => {
          const table = tables[code] ?? [];
          return (
            <div key={code} className="glass-card p-4">
              <h3 className="mb-2 font-semibold">Grupo {code}</h3>
              {table.length === 0 ? (
                <p className="text-sm text-white/50">Sin predicciones aún</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="text-left">Equipo</th>
                      <th>PJ</th>
                      <th>DG</th>
                      <th>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row: {
                      team: { flagEmoji: string; nameEs: string };
                      played: number;
                      goalDifference: number;
                      points: number;
                    }, i: number) => (
                      <tr
                        key={row.team.nameEs}
                        className={
                          i < 2
                            ? "text-green-400"
                            : i === 2
                              ? "text-amber-400"
                              : ""
                        }
                      >
                        <td className="py-1">
                          {row.team.flagEmoji} {row.team.nameEs}
                        </td>
                        <td className="text-center">{row.played}</td>
                        <td className="text-center">{row.goalDifference}</td>
                        <td className="text-center font-bold">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
