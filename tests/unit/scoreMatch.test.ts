import { describe, it, expect } from "vitest";
import { scoreMatch } from "@/lib/scoring/scoreMatch";

describe("scoreMatch", () => {
  const cases: Array<{
    name: string;
    pred: { homeScore: number; awayScore: number; advancingTeamId?: string };
    result: { homeScore: number; awayScore: number; penaltyWinnerTeamId?: string };
    stage: "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL";
    home?: string;
    away?: string;
    expected: number;
  }> = [
    { name: "exact 0-0", pred: { homeScore: 0, awayScore: 0 }, result: { homeScore: 0, awayScore: 0 }, stage: "GROUP", expected: 5 },
    { name: "exact 2-1", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 2, awayScore: 1 }, stage: "GROUP", expected: 5 },
    { name: "exact 3-3", pred: { homeScore: 3, awayScore: 3 }, result: { homeScore: 3, awayScore: 3 }, stage: "GROUP", expected: 5 },
    { name: "winner+diff 2-1 vs 3-2", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 3, awayScore: 2 }, stage: "GROUP", expected: 3 },
    { name: "winner+diff 1-3 vs 0-2", pred: { homeScore: 1, awayScore: 3 }, result: { homeScore: 0, awayScore: 2 }, stage: "GROUP", expected: 3 },
    { name: "winner only 2-0 vs 1-0", pred: { homeScore: 2, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "GROUP", expected: 2 },
    { name: "winner+diff away 0-2 vs 1-3", pred: { homeScore: 0, awayScore: 2 }, result: { homeScore: 1, awayScore: 3 }, stage: "GROUP", expected: 3 },
    { name: "draw correct diff 1-1 vs 2-2", pred: { homeScore: 1, awayScore: 1 }, result: { homeScore: 2, awayScore: 2 }, stage: "GROUP", expected: 3 },
    { name: "wrong outcome 2-0 vs 0-1", pred: { homeScore: 2, awayScore: 0 }, result: { homeScore: 0, awayScore: 1 }, stage: "GROUP", expected: 0 },
    { name: "wrong outcome 3-1 vs 1-1", pred: { homeScore: 3, awayScore: 1 }, result: { homeScore: 1, awayScore: 1 }, stage: "GROUP", expected: 0 },
    { name: "inverted 1-2 vs 2-1", pred: { homeScore: 1, awayScore: 2 }, result: { homeScore: 2, awayScore: 1 }, stage: "GROUP", expected: 0 },
    { name: "max score exact 20-20", pred: { homeScore: 20, awayScore: 20 }, result: { homeScore: 20, awayScore: 20 }, stage: "GROUP", expected: 5 },
    { name: "R32 exact x1", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "R32", expected: 5 },
    { name: "R32 winner+diff x1 ceil", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 4, awayScore: 3 }, stage: "R32", expected: 3 },
    { name: "R16 exact x1.5 ceil", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 2, awayScore: 1 }, stage: "R16", expected: 8 },
    { name: "R16 winner+diff x1.5 ceil", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 2, awayScore: 1 }, stage: "R16", expected: 5 },
    { name: "QF exact x2", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "QF", expected: 10 },
    { name: "QF winner x2", pred: { homeScore: 2, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "QF", expected: 4 },
    { name: "SF exact x2.5 ceil", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "SF", expected: 13 },
    { name: "SF winner x2.5 ceil", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 2, awayScore: 1 }, stage: "SF", expected: 8 },
    { name: "FINAL exact x3", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 2, awayScore: 1 }, stage: "FINAL", expected: 15 },
    { name: "FINAL winner x3", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 2, awayScore: 0 }, stage: "FINAL", expected: 6 },
    { name: "draw advance R32 exact+bonus", pred: { homeScore: 1, awayScore: 1, advancingTeamId: "BRA" }, result: { homeScore: 1, awayScore: 1, penaltyWinnerTeamId: "BRA" }, stage: "R32", home: "BRA", away: "ARG", expected: 7 },
    { name: "draw advance R16 exact+bonus", pred: { homeScore: 0, awayScore: 0, advancingTeamId: "ESP" }, result: { homeScore: 0, awayScore: 0, penaltyWinnerTeamId: "ESP" }, stage: "R16", home: "ESP", away: "POR", expected: 11 },
    { name: "draw advance QF exact+bonus", pred: { homeScore: 2, awayScore: 2, advancingTeamId: "FRA" }, result: { homeScore: 2, awayScore: 2, penaltyWinnerTeamId: "FRA" }, stage: "QF", home: "FRA", away: "GER", expected: 14 },
    { name: "draw advance SF exact+bonus", pred: { homeScore: 1, awayScore: 1, advancingTeamId: "A" }, result: { homeScore: 1, awayScore: 1, penaltyWinnerTeamId: "A" }, stage: "SF", home: "A", away: "B", expected: 18 },
    { name: "draw advance FINAL exact+bonus", pred: { homeScore: 0, awayScore: 0, advancingTeamId: "X" }, result: { homeScore: 0, awayScore: 0, penaltyWinnerTeamId: "X" }, stage: "FINAL", home: "X", away: "Y", expected: 21 },
    { name: "draw wrong advancer exact only", pred: { homeScore: 1, awayScore: 1, advancingTeamId: "A" }, result: { homeScore: 1, awayScore: 1, penaltyWinnerTeamId: "B" }, stage: "R32", home: "A", away: "B", expected: 5 },
    { name: "mutual exclusive exact beats diff", pred: { homeScore: 3, awayScore: 2 }, result: { homeScore: 3, awayScore: 2 }, stage: "GROUP", expected: 5 },
    { name: "mutual exclusive diff beats winner", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 3, awayScore: 2 }, stage: "GROUP", expected: 3 },
    { name: "boundary 0-20", pred: { homeScore: 20, awayScore: 0 }, result: { homeScore: 20, awayScore: 0 }, stage: "GROUP", expected: 5 },
    { name: "R16 exact 0-0", pred: { homeScore: 0, awayScore: 0 }, result: { homeScore: 0, awayScore: 0 }, stage: "R16", expected: 8 },
    { name: "QF diff 3pts x2=6", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 4, awayScore: 3 }, stage: "QF", expected: 6 },
    { name: "SF diff 3pts x2.5=8", pred: { homeScore: 2, awayScore: 1 }, result: { homeScore: 4, awayScore: 3 }, stage: "SF", expected: 8 },
    { name: "R32 wrong 0", pred: { homeScore: 3, awayScore: 0 }, result: { homeScore: 0, awayScore: 2 }, stage: "R32", expected: 0 },
    { name: "FINAL diff 3x3=9", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 3, awayScore: 2 }, stage: "FINAL", expected: 9 },
    { name: "GROUP both draws correct diff", pred: { homeScore: 1, awayScore: 1 }, result: { homeScore: 0, awayScore: 0 }, stage: "GROUP", expected: 3 },
    { name: "GROUP 4-4 vs 2-2 correct diff", pred: { homeScore: 4, awayScore: 4 }, result: { homeScore: 2, awayScore: 2 }, stage: "GROUP", expected: 3 },
    { name: "R32 2-2 draw no bonus no adv", pred: { homeScore: 2, awayScore: 2 }, result: { homeScore: 2, awayScore: 2, penaltyWinnerTeamId: "A" }, stage: "R32", home: "A", away: "B", expected: 5 },
    { name: "R16 1-0 exact", pred: { homeScore: 1, awayScore: 0 }, result: { homeScore: 1, awayScore: 0 }, stage: "R16", expected: 8 },
    { name: "QF 0-1 away win", pred: { homeScore: 0, awayScore: 1 }, result: { homeScore: 0, awayScore: 2 }, stage: "QF", expected: 4 },
    { name: "SF 3-3 draw correct", pred: { homeScore: 3, awayScore: 3 }, result: { homeScore: 3, awayScore: 3 }, stage: "SF", expected: 13 },
    { name: "FINAL 1-1 vs 2-2 correct diff x3", pred: { homeScore: 1, awayScore: 1 }, result: { homeScore: 2, awayScore: 2 }, stage: "FINAL", expected: 9 },
    { name: "GROUP high scoring diff", pred: { homeScore: 5, awayScore: 2 }, result: { homeScore: 7, awayScore: 4 }, stage: "GROUP", expected: 3 },
    { name: "GROUP high scoring winner", pred: { homeScore: 5, awayScore: 2 }, result: { homeScore: 6, awayScore: 1 }, stage: "GROUP", expected: 2 },
  ];

  it.each(cases)("$name", ({ pred, result, stage, home, away, expected }) => {
    expect(scoreMatch(pred, result, stage, home, away)).toBe(expected);
  });
});
