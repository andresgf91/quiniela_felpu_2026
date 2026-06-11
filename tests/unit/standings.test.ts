import { describe, it, expect } from "vitest";
import { computeGroupTable } from "@/lib/standings/computeGroupTable";
import { getBestThirds, rankThirdPlaceTeams } from "@/lib/standings/bestThirds";

describe("computeGroupTable", () => {
  const teams = ["A", "B", "C", "D"];

  it("orders by points", () => {
    const table = computeGroupTable(teams, [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 2, awayScore: 0 },
      { homeTeamId: "C", awayTeamId: "D", homeScore: 0, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "C", homeScore: 3, awayScore: 0 },
      { homeTeamId: "B", awayTeamId: "D", homeScore: 1, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "D", homeScore: 1, awayScore: 0 },
      { homeTeamId: "B", awayTeamId: "C", homeScore: 0, awayScore: 0 },
    ]);
    expect(table[0].teamId).toBe("A");
    expect(table[0].points).toBe(9);
  });

  it("sorts by points descending", () => {
    const table = computeGroupTable(teams, [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 0 },
      { homeTeamId: "C", awayTeamId: "D", homeScore: 0, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "C", homeScore: 0, awayScore: 2 },
      { homeTeamId: "B", awayTeamId: "D", homeScore: 1, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "D", homeScore: 0, awayScore: 0 },
      { homeTeamId: "B", awayTeamId: "C", homeScore: 3, awayScore: 0 },
    ]);
    for (let i = 1; i < table.length; i++) {
      expect(table[i - 1].points).toBeGreaterThanOrEqual(table[i].points);
    }
  });

  it("uses alphabetical fallback", () => {
    const table = computeGroupTable(["X", "Y"], [
      { homeTeamId: "X", awayTeamId: "Y", homeScore: 0, awayScore: 0 },
    ]);
    expect(table[0].teamId).toBe("X");
  });
});

describe("bestThirds", () => {
  it("ranks thirds and takes top 8", () => {
    const thirds = Array.from({ length: 12 }, (_, i) => ({
      teamId: `T${i}`,
      groupCode: String.fromCharCode(65 + i),
      played: 3,
      won: 1,
      drawn: 0,
      lost: 2,
      goalsFor: 3,
      goalsAgainst: 3,
      goalDifference: 0,
      points: i,
    }));
    const best = getBestThirds(thirds);
    expect(best).toHaveLength(8);
    expect(best[0].points).toBe(11);
  });
});
