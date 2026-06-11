import { describe, it, expect } from "vitest";
import { computePropagationUpdates } from "@/lib/bracket/propagateWinner";

describe("knockout propagation", () => {
  const propagation = {
    "89": { home: "W74", away: "W77" },
    "90": { home: "W73", away: "W75" },
    "103": { home: "L101", away: "L102" },
    "104": { home: "W101", away: "W102" },
  };

  it("winner of 73 lands in match 90 home", () => {
    const allMatches = [
      {
        id: 73,
        homeSlot: "2A",
        awaySlot: "2B",
        homeTeamId: "MEX",
        awayTeamId: "RSA",
        homeScore: 2,
        awayScore: 1,
        penaltyWinnerTeamId: null,
      },
      {
        id: 90,
        homeSlot: "W73",
        awaySlot: "W75",
        homeTeamId: null,
        awayTeamId: null,
        homeScore: null,
        awayScore: null,
        penaltyWinnerTeamId: null,
      },
    ];

    const updates = computePropagationUpdates(
      allMatches[0],
      allMatches,
      propagation,
    );

    expect(updates).toContainEqual({ matchId: 90, homeTeamId: "MEX" });
  });

  it("loser of 101 goes to third place home", () => {
    const allMatches = [
      {
        id: 101,
        homeSlot: "W97",
        awaySlot: "W98",
        homeTeamId: "BRA",
        awayTeamId: "ARG",
        homeScore: 1,
        awayScore: 2,
        penaltyWinnerTeamId: null,
      },
      {
        id: 103,
        homeSlot: "L101",
        awaySlot: "L102",
        homeTeamId: null,
        awayTeamId: null,
        homeScore: null,
        awayScore: null,
        penaltyWinnerTeamId: null,
      },
    ];

    const updates = computePropagationUpdates(
      allMatches[0],
      allMatches,
      propagation,
    );

    expect(updates).toContainEqual({ matchId: 103, homeTeamId: "BRA" });
  });
});
