import type { PrismaClient } from "@prisma/client";
import {
  computeBracketBonuses,
  getChampionTeamId,
} from "@/lib/scoring/bracketBonus";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  matchPoints: number;
  bracketBonus: number;
  exactHits: number;
  correctWinners: number;
  efficiency: number;
  lastUpdate: Date | null;
};

export async function computeLeaderboard(
  prisma: PrismaClient,
): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: { match: true },
      },
      bracketPicks: true,
    },
  });

  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED", homeScore: { not: null } },
  });

  const champion = getChampionTeamId(finishedMatches);

  const entries = users.map((user) => {
    let matchPoints = 0;
    let exactHits = 0;
    let correctWinners = 0;
    let maxPossible = 0;
    let lastUpdate: Date | null = null;

    for (const pred of user.predictions) {
      if (pred.updatedAt && (!lastUpdate || pred.updatedAt > lastUpdate)) {
        lastUpdate = pred.updatedAt;
      }

      const match = pred.match;
      if (match.status === "FINISHED" && match.homeScore != null) {
        maxPossible += match.stage === "GROUP" ? 5 : 15;
        if (pred.pointsAwarded != null) {
          matchPoints += pred.pointsAwarded;
          if (
            pred.homeScore === match.homeScore &&
            pred.awayScore === match.awayScore
          ) {
            exactHits += 1;
          }
          const predOutcome =
            pred.homeScore === pred.awayScore
              ? 0
              : pred.homeScore > pred.awayScore
                ? 1
                : -1;
          const awayScore = match.awayScore ?? 0;
          const resOutcome =
            match.homeScore === awayScore
              ? 0
              : match.homeScore! > awayScore
                ? 1
                : -1;
          if (predOutcome === resOutcome) correctWinners += 1;
        }
      }
    }

    const bracketBonus = computeBracketBonuses(
      user.bracketPicks,
      finishedMatches,
      champion,
    );

    const totalPoints = matchPoints + bracketBonus;
    const efficiency =
      maxPossible > 0 ? Math.round((matchPoints / maxPossible) * 100) : 0;

    return {
      rank: 0,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      totalPoints,
      matchPoints,
      bracketBonus,
      exactHits,
      correctWinners,
      efficiency,
      lastUpdate,
    };
  });

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    if (b.correctWinners !== a.correctWinners)
      return b.correctWinners - a.correctWinners;
    const aTime = a.lastUpdate?.getTime() ?? Infinity;
    const bTime = b.lastUpdate?.getTime() ?? Infinity;
    return aTime - bTime;
  });

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
