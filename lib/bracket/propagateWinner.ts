import { getWinnerTeamId } from "@/lib/scoring/scoreMatch";

export type SlotUpdate = {
  matchId: number;
  homeTeamId?: string;
  awayTeamId?: string;
};

export type MatchForPropagation = {
  id: number;
  stage?: string;
  homeSlot: string;
  awaySlot: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinnerTeamId: string | null;
};

export function getSlotLabelForWinner(matchId: number): string {
  return `W${matchId}`;
}

export function getSlotLabelForLoser(matchId: number): string {
  return `L${matchId}`;
}

export function resolveSlotToTeamId(
  slot: string,
  matches: MatchForPropagation[],
  groupQualifiers: Record<string, string>,
): string | null {
  if (/^[A-Z]{3}$/.test(slot)) return slot;

  const groupPos = slot.match(/^([12])([A-L])$/);
  if (groupPos) {
    const pos = groupPos[1] === "1" ? "first" : "second";
    const group = groupPos[2];
    return groupQualifiers[`${pos}_${group}`] ?? null;
  }

  const thirdMatch = slot.match(/^3([A-L](?:\/[A-L])*)$/);
  if (thirdMatch) {
    const options = thirdMatch[1].split("/");
    for (const g of options) {
      const key = `third_${g}`;
      if (groupQualifiers[key]) return groupQualifiers[key];
    }
    return null;
  }

  const winnerRef = slot.match(/^W(\d+)$/);
  if (winnerRef) {
    const m = matches.find((x) => x.id === parseInt(winnerRef[1], 10));
    if (!m || m.homeScore == null || m.awayScore == null) return null;
    if (!m.homeTeamId || !m.awayTeamId) return null;
    return getWinnerTeamId(
      {
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        penaltyWinnerTeamId: m.penaltyWinnerTeamId,
      },
      m.homeTeamId,
      m.awayTeamId,
    );
  }

  const loserRef = slot.match(/^L(\d+)$/);
  if (loserRef) {
    const m = matches.find((x) => x.id === parseInt(loserRef[1], 10));
    if (!m || m.homeScore == null || m.awayScore == null) return null;
    if (!m.homeTeamId || !m.awayTeamId) return null;
    const winner = getWinnerTeamId(
      {
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        penaltyWinnerTeamId: m.penaltyWinnerTeamId,
      },
      m.homeTeamId,
      m.awayTeamId,
    );
    if (!winner) return null;
    return winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
  }

  return null;
}

export function computePropagationUpdates(
  finishedMatch: MatchForPropagation,
  allMatches: MatchForPropagation[],
  propagation: Record<string, { home?: string; away?: string }>,
): SlotUpdate[] {
  const updates: SlotUpdate[] = [];

  if (
    finishedMatch.homeScore == null ||
    finishedMatch.awayScore == null ||
    !finishedMatch.homeTeamId ||
    !finishedMatch.awayTeamId
  ) {
    return updates;
  }

  const winnerId = getWinnerTeamId(
    {
      homeScore: finishedMatch.homeScore,
      awayScore: finishedMatch.awayScore,
      penaltyWinnerTeamId: finishedMatch.penaltyWinnerTeamId,
    },
    finishedMatch.homeTeamId,
    finishedMatch.awayTeamId,
  );

  if (!winnerId) return updates;

  for (const match of allMatches) {
    const rules = propagation[String(match.id)];
    if (!rules) continue;

    const update: SlotUpdate = { matchId: match.id };

    if (rules.home === `W${finishedMatch.id}`) {
      update.homeTeamId = winnerId;
    }
    if (rules.away === `W${finishedMatch.id}`) {
      update.awayTeamId = winnerId;
    }
    if (rules.home === `L${finishedMatch.id}`) {
      update.homeTeamId =
        winnerId === finishedMatch.homeTeamId
          ? finishedMatch.awayTeamId!
          : finishedMatch.homeTeamId!;
    }
    if (rules.away === `L${finishedMatch.id}`) {
      update.awayTeamId =
        winnerId === finishedMatch.homeTeamId
          ? finishedMatch.awayTeamId!
          : finishedMatch.homeTeamId!;
    }

    if (update.homeTeamId || update.awayTeamId) {
      updates.push(update);
    }
  }

  return updates;
}

export function resolveAllKnockoutTeams(
  matches: MatchForPropagation[],
  groupQualifiers: Record<string, string>,
): MatchForPropagation[] {
  return matches.map((m) => {
    if (m.stage === "GROUP" || m.id <= 72) return m;
    const home =
      m.homeTeamId ??
      resolveSlotToTeamId(m.homeSlot, matches, groupQualifiers);
    const away =
      m.awayTeamId ??
      resolveSlotToTeamId(m.awaySlot, matches, groupQualifiers);
    return { ...m, homeTeamId: home, awayTeamId: away };
  }) as MatchForPropagation[];
}
