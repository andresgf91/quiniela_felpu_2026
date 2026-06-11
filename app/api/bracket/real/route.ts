import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const matches = await prisma.match.findMany({
    where: { stage: { not: "GROUP" } },
    orderBy: { id: "asc" },
  });
  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  return jsonOk(
    matches.map((m) => ({
      id: m.id,
      stage: m.stage,
      kickoffUtc: m.kickoffUtc.toISOString(),
      homeTeam: m.homeTeamId ? teamMap[m.homeTeamId] : null,
      awayTeam: m.awayTeamId ? teamMap[m.awayTeamId] : null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
    })),
  );
}
