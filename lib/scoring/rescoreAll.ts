import type { PrismaClient } from "@prisma/client";
import { scoreMatch } from "@/lib/scoring/scoreMatch";
export async function rescoreMatch(prisma: PrismaClient, matchId: number) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.homeScore == null || match.awayScore == null) return;

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  for (const pred of predictions) {
    const points = scoreMatch(
      {
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        advancingTeamId: pred.advancingTeamId,
      },
      {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        penaltyWinnerTeamId: match.penaltyWinnerTeamId,
      },
      match.stage,
      match.homeTeamId,
      match.awayTeamId,
    );

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsAwarded: points },
    });
  }
}

export async function rescoreAll(prisma: PrismaClient) {
  const finished = await prisma.match.findMany({
    where: { status: "FINISHED", homeScore: { not: null } },
  });

  for (const match of finished) {
    await rescoreMatch(prisma, match.id);
  }
}
