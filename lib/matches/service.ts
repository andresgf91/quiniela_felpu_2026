import type { PrismaClient } from "@prisma/client";
import { loadFixture } from "@/lib/fixture";
import {
  computePropagationUpdates,
  type MatchForPropagation,
} from "@/lib/bracket/propagateWinner";
import { rescoreMatch } from "@/lib/scoring/rescoreAll";

export async function enterMatchResult(
  prisma: PrismaClient,
  matchId: number,
  data: {
    homeScore: number;
    awayScore: number;
    penaltyWinnerTeamId?: string | null;
    status?: "SCHEDULED" | "LIVE" | "FINISHED";
    resultSource: "API" | "ADMIN";
  },
) {
  const existing = await prisma.match.findUnique({ where: { id: matchId } });
  if (!existing) throw new Error("MATCH_NOT_FOUND");
  if (existing.resultSource === "ADMIN" && data.resultSource === "API") {
    return existing;
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      penaltyWinnerTeamId: data.penaltyWinnerTeamId ?? null,
      status: data.status ?? "FINISHED",
      resultSource: data.resultSource,
    },
  });

  if (updated.status === "FINISHED") {
    const fixture = loadFixture();
    const allMatches = await prisma.match.findMany({ orderBy: { id: "asc" } });
    const propagationMatches: MatchForPropagation[] = allMatches.map((m) => ({
      id: m.id,
      stage: m.stage,
      homeSlot: m.homeSlot,
      awaySlot: m.awaySlot,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      penaltyWinnerTeamId: m.penaltyWinnerTeamId,
    }));

    const finished = propagationMatches.find((m) => m.id === matchId)!;
    const updates = computePropagationUpdates(
      finished,
      propagationMatches,
      fixture.knockoutBracket.propagation,
    ); // group qualifiers resolved at seed for R32 slots

    for (const u of updates) {
      await prisma.match.update({
        where: { id: u.matchId },
        data: {
          ...(u.homeTeamId ? { homeTeamId: u.homeTeamId } : {}),
          ...(u.awayTeamId ? { awayTeamId: u.awayTeamId } : {}),
        },
      });
    }

    await rescoreMatch(prisma, matchId);
  }

  return updated;
}
