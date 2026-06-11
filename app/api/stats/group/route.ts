import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const championPicks = await prisma.bracketPick.findMany({
    where: { slot: "CHAMPION" },
    include: { user: { select: { name: true } } },
  });

  const counts = new Map<string, { teamId: string; count: number; users: string[] }>();
  for (const pick of championPicks) {
    const existing = counts.get(pick.teamId) ?? {
      teamId: pick.teamId,
      count: 0,
      users: [],
    };
    existing.count += 1;
    existing.users.push(pick.user.name);
    counts.set(pick.teamId, existing);
  }

  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const thermometer = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      team: teamMap[c.teamId],
      count: c.count,
      users: c.users,
    }));

  const allPredictions = await prisma.prediction.findMany({
    where: { match: { stage: "GROUP" } },
    include: { match: true },
  });

  const trendByMatch = new Map<
    number,
    { homeWins: number; draws: number; awayWins: number; total: number }
  >();

  for (const p of allPredictions) {
    const t = trendByMatch.get(p.matchId) ?? {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      total: 0,
    };
    t.total += 1;
    if (p.homeScore > p.awayScore) t.homeWins += 1;
    else if (p.homeScore < p.awayScore) t.awayWins += 1;
    else t.draws += 1;
    trendByMatch.set(p.matchId, t);
  }

  return jsonOk({
    thermometer,
    matchTrends: Object.fromEntries(trendByMatch),
  });
}
