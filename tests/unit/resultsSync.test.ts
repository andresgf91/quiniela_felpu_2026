import { describe, it, expect } from "vitest";
import { parseFootballDataMatch } from "@/lib/resultsSync";

describe("parseFootballDataMatch", () => {
  it("parses finished match", () => {
    const result = parseFootballDataMatch({
      id: 1,
      status: "FINISHED",
      score: { fullTime: { home: 2, away: 1 } },
      homeTeam: { id: 1, name: "Mexico" },
      awayTeam: { id: 2, name: "RSA" },
    });
    expect(result).toEqual({
      homeScore: 2,
      awayScore: 1,
      penaltyWinnerTeamId: null,
      status: "FINISHED",
    });
  });

  it("parses live match", () => {
    const result = parseFootballDataMatch({
      id: 1,
      status: "IN_PLAY",
      score: { fullTime: { home: 1, away: 0 } },
      homeTeam: { id: 1, name: "A" },
      awayTeam: { id: 2, name: "B" },
    });
    expect(result?.status).toBe("LIVE");
  });

  it("returns null for scheduled without score", () => {
    const result = parseFootballDataMatch({
      id: 1,
      status: "SCHEDULED",
      score: { fullTime: { home: null, away: null } },
      homeTeam: { id: 1, name: "A" },
      awayTeam: { id: 2, name: "B" },
    });
    expect(result).toBeNull();
  });
});
