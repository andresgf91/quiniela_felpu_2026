import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.userId },
    include: { match: true },
  });

  const groupPreds = predictions.filter((p) => p.match.stage === "GROUP");
  const totalGoals = groupPreds.reduce(
    (sum, p) => sum + p.homeScore + p.awayScore,
    0,
  );
  const finishedOfficial = await prisma.match.count({
    where: { status: "FINISHED" },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { soulTeam: true },
  });

  return jsonOk({
    matchesPredicted: predictions.length,
    groupMatchesPredicted: groupPreds.length,
    totalGoalsPredicted: totalGoals,
    avgGoalsPerMatch:
      groupPreds.length > 0
        ? Math.round((totalGoals / groupPreds.length) * 10) / 10
        : 0,
    officialResultsCount: finishedOfficial,
    soulTeam: user?.soulTeam ?? null,
  });
}
