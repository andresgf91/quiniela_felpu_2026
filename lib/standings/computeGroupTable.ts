import type { StandingRow } from "@/lib/types";

export type GroupMatch = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

function initRow(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyResult(rows: Map<string, StandingRow>, m: GroupMatch) {
  const home = rows.get(m.homeTeamId)!;
  const away = rows.get(m.awayTeamId)!;

  home.played += 1;
  away.played += 1;
  home.goalsFor += m.homeScore;
  home.goalsAgainst += m.awayScore;
  away.goalsFor += m.awayScore;
  away.goalsAgainst += m.homeScore;

  if (m.homeScore > m.awayScore) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (m.homeScore < m.awayScore) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function h2hStats(
  teamIds: string[],
  matches: GroupMatch[],
): Map<string, { points: number; gd: number; gf: number }> {
  const stats = new Map(
    teamIds.map((id) => [id, { points: 0, gd: 0, gf: 0 }]),
  );
  const set = new Set(teamIds);

  for (const m of matches) {
    if (!set.has(m.homeTeamId) || !set.has(m.awayTeamId)) continue;
    const home = stats.get(m.homeTeamId)!;
    const away = stats.get(m.awayTeamId)!;
    home.gf += m.homeScore;
    away.gf += m.awayScore;
    home.gd += m.homeScore - m.awayScore;
    away.gd += m.awayScore - m.homeScore;

    if (m.homeScore > m.awayScore) home.points += 3;
    else if (m.homeScore < m.awayScore) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  return stats;
}

function compareTied(
  a: StandingRow,
  b: StandingRow,
  tiedIds: string[],
  matches: GroupMatch[],
): number {
  const h2h = h2hStats(tiedIds, matches);
  const ha = h2h.get(a.teamId)!;
  const hb = h2h.get(b.teamId)!;

  if (ha.points !== hb.points) return hb.points - ha.points;
  if (ha.gd !== hb.gd) return hb.gd - ha.gd;
  if (ha.gf !== hb.gf) return hb.gf - ha.gf;
  return a.teamId.localeCompare(b.teamId);
}

function sortGroup(rows: StandingRow[], matches: GroupMatch[]): StandingRow[] {
  const sorted = [...rows];

  const rank = () => {
    sorted.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    });
  };

  rank();

  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].points === sorted[i].points &&
      sorted[j].goalDifference === sorted[i].goalDifference &&
      sorted[j].goalsFor === sorted[i].goalsFor
    ) {
      j += 1;
    }

    if (j - i > 1) {
      const tied = sorted.slice(i, j);
      const tiedIds = tied.map((r) => r.teamId);
      tied.sort((a, b) => compareTied(a, b, tiedIds, matches));
      sorted.splice(i, j - i, ...tied);
    }
    i = j;
  }

  return sorted;
}

export function computeGroupTable(
  teamIds: string[],
  matches: GroupMatch[],
): StandingRow[] {
  const rows = new Map(teamIds.map((id) => [id, initRow(id)]));

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    applyResult(rows, m);
  }

  return sortGroup([...rows.values()], matches);
}

export function computeAllGroupTables(
  groups: Record<string, string[]>,
  matches: Array<GroupMatch & { groupCode: string }>,
): Record<string, StandingRow[]> {
  const result: Record<string, StandingRow[]> = {};

  for (const [code, teamIds] of Object.entries(groups)) {
    const groupMatches = matches.filter((m) => m.groupCode === code);
    result[code] = computeGroupTable(teamIds, groupMatches);
  }

  return result;
}
