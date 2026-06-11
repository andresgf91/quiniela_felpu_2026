"use client";

import { useQuery } from "@tanstack/react-query";

const GROUPS = "ABCDEFGHIJKL".split("");

export default function PosicionesPage() {
  const { data: standings } = useQuery({
    queryKey: ["standings-real"],
    queryFn: async () => {
      const res = await fetch("/api/standings/real");
      return res.json();
    },
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold gold-text">Posiciones — Resultados reales</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((code) => {
          const table = standings?.[code] ?? [];
          return (
            <div key={code} className="glass-card p-4">
              <h3 className="mb-2 font-semibold">Grupo {code}</h3>
              {table.length === 0 ? (
                <p className="text-sm text-white/50">Sin resultados aún</p>
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
                      zone: string;
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
