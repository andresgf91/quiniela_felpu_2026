import type { StandingRow } from "@/lib/types";

export type ThirdPlaceTeam = StandingRow & { groupCode: string };

export function rankThirdPlaceTeams(
  thirdPlaceTeams: ThirdPlaceTeam[],
): ThirdPlaceTeam[] {
  return [...thirdPlaceTeams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference)
      return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

export function getBestThirds(thirdPlaceTeams: ThirdPlaceTeam[]): ThirdPlaceTeam[] {
  return rankThirdPlaceTeams(thirdPlaceTeams).slice(0, 8);
}

/** Resolve a third-place slot label like "3A/B/C/D/F" given qualifying group codes */
export function resolveThirdPlaceSlot(
  slotLabel: string,
  qualifyingThirdGroups: Set<string>,
): string | null {
  if (!slotLabel.startsWith("3")) return slotLabel;

  const options = slotLabel
    .slice(1)
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean);

  for (const group of options) {
    if (qualifyingThirdGroups.has(group)) {
      return `3${group}`;
    }
  }
  return null;
}

export function buildQualifyingThirdGroups(
  groupTables: Record<string, StandingRow[]>,
  bestThirdTeamIds: Set<string>,
): Set<string> {
  const groups = new Set<string>();
  for (const [code, table] of Object.entries(groupTables)) {
    const third = table[2];
    if (third && bestThirdTeamIds.has(third.teamId)) {
      groups.add(code);
    }
  }
  return groups;
}
