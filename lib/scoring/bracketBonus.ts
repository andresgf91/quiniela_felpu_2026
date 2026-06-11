import type { Stage } from "@prisma/client";
import { BRACKET_BONUS } from "@/lib/types";
import { getWinnerTeamId } from "@/lib/scoring/scoreMatch";

export type FinishedMatch = {
  id: number;
  stage: Stage;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinnerTeamId: string | null;
};

/** Highest knockout stage each team actually reached */
export function getTeamsReachedStage(
  matches: FinishedMatch[],
): Map<string, Set<Stage>> {
  const reached = new Map<string, Set<Stage>>();

  const add = (teamId: string, stage: Stage) => {
    const set = reached.get(teamId) ?? new Set();
    set.add(stage);
    reached.set(teamId, set);
  };

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.stage === "GROUP") continue;

    add(m.homeTeamId, m.stage);
    add(m.awayTeamId, m.stage);

    const winner = getWinnerTeamId(
      {
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        penaltyWinnerTeamId: m.penaltyWinnerTeamId,
      },
      m.homeTeamId,
      m.awayTeamId,
    );
    if (!winner) continue;

    if (m.stage === "R32") add(winner, "R16");
    if (m.stage === "R16") add(winner, "QF");
    if (m.stage === "QF") add(winner, "SF");
    if (m.stage === "SF") add(winner, "FINAL");
    if (m.stage === "FINAL") add(winner, "FINAL");
  }

  return reached;
}

export function bracketBonusForTeam(
  teamId: string,
  reached: Map<string, Set<Stage>>,
): number {
  const stages = reached.get(teamId);
  if (!stages) return 0;

  let total = 0;
  const hasR16 =
    stages.has("R16") ||
    stages.has("QF") ||
    stages.has("SF") ||
    stages.has("FINAL") ||
    stages.has("THIRD");
  const hasQF =
    stages.has("QF") || stages.has("SF") || stages.has("FINAL") || stages.has("THIRD");
  const hasSF = stages.has("SF") || stages.has("FINAL") || stages.has("THIRD");
  const hasFinalist = stages.has("FINAL") || stages.has("THIRD");

  if (hasR16) total += BRACKET_BONUS.R16;
  if (hasQF) total += BRACKET_BONUS.QF;
  if (hasSF) total += BRACKET_BONUS.SF;
  if (hasFinalist) total += BRACKET_BONUS.FINALIST;

  return total;
}

export function computeBracketBonuses(
  picks: Array<{ slot: string; teamId: string }>,
  matches: FinishedMatch[],
  championTeamId?: string | null,
): number {
  const reached = getTeamsReachedStage(matches);
  let total = 0;
  const counted = new Set<string>();

  for (const pick of picks) {
    if (pick.slot === "CHAMPION") {
      if (championTeamId && pick.teamId === championTeamId) {
        total += BRACKET_BONUS.CHAMPION;
        if (!counted.has(pick.teamId)) {
          total += bracketBonusForTeam(pick.teamId, reached);
          counted.add(pick.teamId);
        }
      }
      continue;
    }
    if (pick.slot === "THIRD_PLACE") continue;
    if (counted.has(pick.teamId)) continue;

    const bonus = bracketBonusForTeam(pick.teamId, reached);
    if (bonus > 0) {
      total += bonus;
      counted.add(pick.teamId);
    }
  }

  return total;
}

export function getChampionTeamId(matches: FinishedMatch[]): string | null {
  const final = matches.find((m) => m.stage === "FINAL" && m.homeScore != null);
  if (!final?.homeTeamId || !final.awayTeamId || final.homeScore == null)
    return null;
  return getWinnerTeamId(
    {
      homeScore: final.homeScore,
      awayScore: final.awayScore!,
      penaltyWinnerTeamId: final.penaltyWinnerTeamId,
    },
    final.homeTeamId,
    final.awayTeamId,
  );
}
