"use client";

import { useQuery } from "@tanstack/react-query";

export default function EstadisticasPage() {
  const { data: me } = useQuery({
    queryKey: ["stats-me"],
    queryFn: async () => {
      const res = await fetch("/api/stats/me");
      return res.json();
    },
  });

  const { data: group } = useQuery({
    queryKey: ["stats-group"],
    queryFn: async () => {
      const res = await fetch("/api/stats/group");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold gold-text">Estadísticas</h2>

      <section className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Tu multiverso personal</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Partidos predichos" value={me?.matchesPredicted ?? 0} />
          <Stat label="Grupos predichos" value={me?.groupMatchesPredicted ?? 0} />
          <Stat label="Goles predichos" value={me?.totalGoalsPredicted ?? 0} />
          <Stat label="Promedio goles" value={me?.avgGoalsPerMatch ?? 0} />
        </div>
      </section>

      <section className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Termómetro del Nexo</h3>
        <p className="mb-3 text-sm text-white/60">
          Campeones más elegidos en el grupo
        </p>
        {group?.thermometer?.length ? (
          <ul className="space-y-2">
            {group.thermometer.map((t: {
              team: { flagEmoji: string; nameEs: string };
              count: number;
            }) => (
              <li key={t.team.nameEs} className="flex justify-between text-sm">
                <span>
                  {t.team.flagEmoji} {t.team.nameEs}
                </span>
                <span className="gold-text font-semibold">{t.count} votos</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/50">Aún no hay picks de campeón</p>
        )}
      </section>

      {me?.soulTeam && (
        <section className="glass-card p-6">
          <h3 className="mb-2 font-semibold">Equipo del alma</h3>
          <p className="text-2xl">
            {me.soulTeam.flagEmoji} {me.soulTeam.nameEs}
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold gold-text">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
