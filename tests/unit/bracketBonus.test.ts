import { describe, it, expect } from "vitest";
import {
  computeBracketBonuses,
  getChampionTeamId,
} from "@/lib/scoring/bracketBonus";

describe("bracketBonus", () => {
  const matches = [
    {
      id: 101,
      stage: "SF" as const,
      homeTeamId: "BRA",
      awayTeamId: "ARG",
      homeScore: 2,
      awayScore: 1,
      penaltyWinnerTeamId: null,
    },
    {
      id: 102,
      stage: "SF" as const,
      homeTeamId: "FRA",
      awayTeamId: "ESP",
      homeScore: 1,
      awayScore: 0,
      penaltyWinnerTeamId: null,
    },
    {
      id: 104,
      stage: "FINAL" as const,
      homeTeamId: "BRA",
      awayTeamId: "FRA",
      homeScore: 3,
      awayScore: 1,
      penaltyWinnerTeamId: null,
    },
  ];

  it("detects champion", () => {
    expect(getChampionTeamId(matches)).toBe("BRA");
  });

  it("awards stacking bonuses for champion pick", () => {
    const picks = [
      { slot: "W101", teamId: "BRA" },
      { slot: "CHAMPION", teamId: "BRA" },
    ];
    const total = computeBracketBonuses(picks, matches, "BRA");
    expect(total).toBeGreaterThanOrEqual(25);
  });
});
