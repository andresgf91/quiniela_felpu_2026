import { z } from "zod";

export const predictionBodySchema = z.object({
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
  advancingTeamId: z.string().optional().nullable(),
});

export const registerSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(2).max(30).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 _-]+$/),
  pin: z.string().regex(/^\d{4,6}$/),
});

export const loginSchema = z.object({
  name: z.string().min(1),
  pin: z.string().regex(/^\d{4,6}$/),
});

export const adminResultSchema = z.object({
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
  penaltyWinnerTeamId: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED"]).optional(),
});

export const bracketPicksSchema = z.object({
  picks: z.array(
    z.object({
      slot: z.string(),
      teamId: z.string(),
    }),
  ),
});
