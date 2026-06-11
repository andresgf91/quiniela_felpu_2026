import { prisma } from "@/lib/db";
import { enterMatchResult } from "@/lib/matches/service";

export type FootballDataMatch = {
  id: number;
  status: string;
  score: {
    fullTime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
  };
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
};

export type SyncResult = {
  synced: number;
  skipped: number;
  errors: string[];
  lastSync: string;
};

export function parseFootballDataMatch(api: FootballDataMatch) {
  const homeScore = api.score.fullTime?.home;
  const awayScore = api.score.fullTime?.away;

  if (homeScore == null || awayScore == null) return null;

  let penaltyWinnerTeamId: string | null = null;
  if (
    homeScore === awayScore &&
    api.score.penalty?.home != null &&
    api.score.penalty?.away != null
  ) {
    penaltyWinnerTeamId =
      api.score.penalty.home > api.score.penalty.away ? "home" : "away";
  }

  return {
    homeScore,
    awayScore,
    penaltyWinnerTeamId,
    status:
      api.status === "FINISHED"
        ? ("FINISHED" as const)
        : api.status === "IN_PLAY" || api.status === "PAUSED"
          ? ("LIVE" as const)
          : ("SCHEDULED" as const),
  };
}

export async function syncResults(dateFrom?: string, dateTo?: string): Promise<SyncResult> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  const errors: string[] = [];
  let synced = 0;
  let skipped = 0;

  if (!token) {
    return {
      synced: 0,
      skipped: 0,
      errors: ["FOOTBALL_DATA_TOKEN no configurado"],
      lastSync: new Date().toISOString(),
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = dateFrom ?? today;
  const to = dateTo ?? today;

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${from}&dateTo=${to}`,
      { headers: { "X-Auth-Token": token } },
    );

    if (!res.ok) {
      errors.push(`API error: ${res.status}`);
      return { synced, skipped, errors, lastSync: new Date().toISOString() };
    }

    const data = (await res.json()) as { matches: FootballDataMatch[] };
    const dbMatches = await prisma.match.findMany({
      where: { externalId: { not: null } },
    });
    const byExternal = new Map(
      dbMatches.map((m) => [m.externalId!, m]),
    );

    for (const apiMatch of data.matches) {
      const dbMatch = byExternal.get(apiMatch.id);
      if (!dbMatch) {
        errors.push(`Unmapped API match ${apiMatch.id}`);
        continue;
      }

      if (dbMatch.resultSource === "ADMIN") {
        skipped += 1;
        continue;
      }

      const parsed = parseFootballDataMatch(apiMatch);
      if (!parsed) continue;

      if (parsed.status === "FINISHED") {
        await enterMatchResult(prisma, dbMatch.id, {
          homeScore: parsed.homeScore,
          awayScore: parsed.awayScore,
          penaltyWinnerTeamId: parsed.penaltyWinnerTeamId,
          status: "FINISHED",
          resultSource: "API",
        });
        synced += 1;
      } else {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: { status: parsed.status },
        });
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Unknown sync error");
  }

  return {
    synced,
    skipped,
    errors,
    lastSync: new Date().toISOString(),
  };
}
