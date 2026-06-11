import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";
import { isMatchLocked } from "@/lib/predictions/isLocked";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const now = new Date();
  const matches = await prisma.match.findMany({
    orderBy: { kickoffUtc: "asc" },
    include: {
      predictions: {
        where: { userId: session.userId },
        take: 1,
      },
    },
  });

  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const result = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    groupCode: m.groupCode,
    kickoffUtc: m.kickoffUtc.toISOString(),
    venue: m.venue,
    city: m.city,
    homeSlot: m.homeSlot,
    awaySlot: m.awaySlot,
    homeTeam: m.homeTeamId ? teamMap[m.homeTeamId] : null,
    awayTeam: m.awayTeamId ? teamMap[m.awayTeamId] : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    locked: isMatchLocked(m.kickoffUtc, now),
    canPredict:
      !isMatchLocked(m.kickoffUtc, now) &&
      (m.stage === "GROUP" || Boolean(m.homeTeamId && m.awayTeamId)),
    prediction: m.predictions[0]
      ? {
          homeScore: m.predictions[0].homeScore,
          awayScore: m.predictions[0].awayScore,
          advancingTeamId: m.predictions[0].advancingTeamId,
          pointsAwarded: m.predictions[0].pointsAwarded,
        }
      : null,
  }));

  return jsonOk(result);
}
