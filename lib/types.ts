import type { Stage } from "@prisma/client";

export type FixtureTeam = {
  id: string;
  nameEs: string;
  nameEn: string;
  flagEmoji: string;
  groupCode: string;
};

export type FixtureMatch = {
  id: number;
  stage: string;
  groupCode: string | null;
  kickoffUtc: string;
  venue: string;
  city: string;
  homeSlot: string;
  awaySlot: string;
};

export type FixtureData = {
  teams: FixtureTeam[];
  matches: FixtureMatch[];
  thirdPlaceAllocation: {
    _comment?: string;
    slots: Record<string, string>;
    lookupTable: Record<string, Record<string, string>>;
  };
  knockoutBracket: {
    propagation: Record<string, { home?: string; away?: string }>;
  };
};

export type MatchResult = {
  homeScore: number;
  awayScore: number;
  penaltyWinnerTeamId?: string | null;
};

export type PredictionInput = {
  homeScore: number;
  awayScore: number;
  advancingTeamId?: string | null;
};

export type StandingRow = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type StageMultiplier = {
  multiplier: number;
  drawAdvanceBonus: number;
};

export const STAGE_MULTIPLIERS: Record<Exclude<Stage, "GROUP">, StageMultiplier> = {
  R32: { multiplier: 1, drawAdvanceBonus: 2 },
  R16: { multiplier: 1.5, drawAdvanceBonus: 3 },
  QF: { multiplier: 2, drawAdvanceBonus: 4 },
  SF: { multiplier: 2.5, drawAdvanceBonus: 5 },
  THIRD: { multiplier: 3, drawAdvanceBonus: 6 },
  FINAL: { multiplier: 3, drawAdvanceBonus: 6 },
};

export const BRACKET_BONUS = {
  R16: 2,
  QF: 4,
  SF: 10,
  FINALIST: 15,
  CHAMPION: 25,
} as const;
