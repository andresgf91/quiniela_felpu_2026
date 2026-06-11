import type { PrismaClient } from "@prisma/client";
import { getGroupTeams } from "@/lib/fixture";
import { computeAllGroupTables } from "@/lib/standings/computeGroupTable";
import { getBestThirds } from "@/lib/standings/bestThirds";

export async function getRealStandings(prisma: PrismaClient) {
  const groups = getGroupTeams();
  const matches = await prisma.match.findMany({
    where: { stage: "GROUP", status: "FINISHED", homeScore: { not: null } },
  });

  const groupMatches = matches.map((m) => ({
    groupCode: m.groupCode!,
    homeTeamId: m.homeTeamId!,
    awayTeamId: m.awayTeamId!,
    homeScore: m.homeScore!,
    awayScore: m.awayScore!,
  }));

  return computeAllGroupTables(groups, groupMatches);
}

export async function getPredictedStandings(
  prisma: PrismaClient,
  userId: string,
) {
  const groups = getGroupTeams();
  const predictions = await prisma.prediction.findMany({
    where: { userId, match: { stage: "GROUP" } },
    include: { match: true },
  });

  const groupMatches = predictions.map((p) => ({
    groupCode: p.match.groupCode!,
    homeTeamId: p.match.homeTeamId!,
    awayTeamId: p.match.awayTeamId!,
    homeScore: p.homeScore,
    awayScore: p.awayScore,
  }));

  const tables = computeAllGroupTables(groups, groupMatches);

  const thirds = Object.entries(tables).map(([groupCode, table]) => ({
    groupCode,
    ...table[2],
  }));

  const bestThirds = getBestThirds(
    thirds.filter((t) => t.teamId),
  );

  return { tables, bestThirds };
}
