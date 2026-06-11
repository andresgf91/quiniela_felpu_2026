import { describe, it, expect } from "vitest";
import {
  predictionBodySchema,
  registerSchema,
  loginSchema,
} from "@/lib/validation/prediction";

describe("Zod schemas", () => {
  it("accepts valid prediction", () => {
    expect(
      predictionBodySchema.safeParse({ homeScore: 2, awayScore: 1 }).success,
    ).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(
      predictionBodySchema.safeParse({ homeScore: -1, awayScore: 0 }).success,
    ).toBe(false);
  });

  it("rejects scores over 20", () => {
    expect(
      predictionBodySchema.safeParse({ homeScore: 21, awayScore: 0 }).success,
    ).toBe(false);
  });

  it("rejects float scores", () => {
    expect(
      predictionBodySchema.safeParse({ homeScore: 1.5, awayScore: 0 }).success,
    ).toBe(false);
  });

  it("validates register pin", () => {
    expect(
      registerSchema.safeParse({
        inviteCode: "x",
        name: "Ana",
        pin: "1234",
      }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        inviteCode: "x",
        name: "Ana",
        pin: "123",
      }).success,
    ).toBe(false);
  });

  it("validates login", () => {
    expect(loginSchema.safeParse({ name: "Ana", pin: "123456" }).success).toBe(
      true,
    );
  });
});
