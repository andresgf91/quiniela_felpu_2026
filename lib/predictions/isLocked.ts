export function isMatchLocked(kickoffUtc: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoffUtc.getTime();
}

export function canPredictMatch(
  kickoffUtc: Date,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  stage: string,
  now: Date = new Date(),
): boolean {
  if (isMatchLocked(kickoffUtc, now)) return false;
  if (stage === "GROUP") return true;
  return Boolean(homeTeamId && awayTeamId);
}
