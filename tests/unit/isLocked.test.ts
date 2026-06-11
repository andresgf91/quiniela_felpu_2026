import { describe, it, expect } from "vitest";
import { isMatchLocked, canPredictMatch } from "@/lib/predictions/isLocked";

describe("isMatchLocked", () => {
  const kickoff = new Date("2026-06-11T19:00:00.000Z");

  it("unlocked 1 second before", () => {
    const now = new Date(kickoff.getTime() - 1000);
    expect(isMatchLocked(kickoff, now)).toBe(false);
  });

  it("locked at kickoff", () => {
    expect(isMatchLocked(kickoff, kickoff)).toBe(true);
  });

  it("locked 1 second after", () => {
    const now = new Date(kickoff.getTime() + 1000);
    expect(isMatchLocked(kickoff, now)).toBe(true);
  });
});

describe("canPredictMatch", () => {
  const kickoff = new Date("2026-06-11T19:00:00.000Z");
  const before = new Date(kickoff.getTime() - 60000);

  it("group match open before kickoff", () => {
    expect(canPredictMatch(kickoff, "A", "B", "GROUP", before)).toBe(true);
  });

  it("knockout needs both teams", () => {
    expect(canPredictMatch(kickoff, null, null, "R32", before)).toBe(false);
    expect(canPredictMatch(kickoff, "A", "B", "R32", before)).toBe(true);
  });
});
