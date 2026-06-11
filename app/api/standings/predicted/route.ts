import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";
import { getPredictedStandings } from "@/lib/standings/service";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const { tables, bestThirds } = await getPredictedStandings(
    prisma,
    session.userId,
  );
  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const enriched = Object.fromEntries(
    Object.entries(tables).map(([code, rows]) => [
      code,
      rows.map((r, i) => ({
        ...r,
        position: i + 1,
        team: teamMap[r.teamId],
        zone: i < 2 ? "qualified" : i === 2 ? "third" : "out",
      })),
    ]),
  );

  const groupPredictions = await prisma.prediction.count({
    where: { userId: session.userId, match: { stage: "GROUP" } },
  });

  return jsonOk({
    tables: enriched,
    bestThirds: bestThirds.map((t) => ({
      ...t,
      team: teamMap[t.teamId],
    })),
    stats: {
      groupPredictions,
      totalGroupMatches: 72,
    },
  });
}
