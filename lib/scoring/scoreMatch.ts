import type { Stage } from "@prisma/client";
import type { PredictionInput, MatchResult } from "@/lib/types";
import { STAGE_MULTIPLIERS } from "@/lib/types";

function baseTierPoints(pred: PredictionInput, result: MatchResult): number {
  const { homeScore: ph, awayScore: pa } = pred;
  const { homeScore: rh, awayScore: ra } = result;

  if (ph === rh && pa === ra) return 5;

  const predDiff = ph - pa;
  const resDiff = rh - ra;
  const predOutcome = predDiff === 0 ? 0 : predDiff > 0 ? 1 : -1;
  const resOutcome = resDiff === 0 ? 0 : resDiff > 0 ? 1 : -1;

  if (predOutcome === resOutcome && predDiff === resDiff) return 3;
  if (predOutcome === resOutcome) return 2;
  return 0;
}

function applyMultiplier(points: number, stage: Stage): number {
  if (stage === "GROUP") return points;
  const { multiplier } = STAGE_MULTIPLIERS[stage];
  return Math.ceil(points * multiplier);
}

export function getAdvancingTeamId(
  result: MatchResult,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  if (result.homeScore > result.awayScore) return homeTeamId;
  if (result.awayScore > result.homeScore) return awayTeamId;
  return result.penaltyWinnerTeamId ?? null;
}

function drawAdvanceBonus(
  pred: PredictionInput,
  result: MatchResult,
  stage: Stage,
  homeTeamId?: string | null,
  awayTeamId?: string | null,
): number {
  if (stage === "GROUP") return 0;
  if (pred.homeScore !== pred.awayScore) return 0;
  if (!pred.advancingTeamId || !homeTeamId || !awayTeamId) return 0;

  const actual = getAdvancingTeamId(result, homeTeamId, awayTeamId);
  if (!actual) return 0;

  return pred.advancingTeamId === actual
    ? STAGE_MULTIPLIERS[stage].drawAdvanceBonus
    : 0;
}

export function scoreMatch(
  prediction: PredictionInput,
  result: MatchResult,
  stage: Stage,
  homeTeamId?: string | null,
  awayTeamId?: string | null,
): number {
  const base = baseTierPoints(prediction, result);
  const points = applyMultiplier(base, stage);
  const bonus = drawAdvanceBonus(
    prediction,
    result,
    stage,
    homeTeamId,
    awayTeamId,
  );
  return points + bonus;
}

export function getWinnerTeamId(
  result: MatchResult,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  return getAdvancingTeamId(result, homeTeamId, awayTeamId);
}
