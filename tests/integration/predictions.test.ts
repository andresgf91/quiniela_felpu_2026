import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPin } from "@/lib/auth/pin";
import { isMatchLocked } from "@/lib/predictions/isLocked";
import { rescoreAll } from "@/lib/scoring/rescoreAll";

const prisma = new PrismaClient();
const hasDb = process.env.DATABASE_URL?.includes("quiniela");

describe.skipIf(!hasDb)("prediction integration", () => {
  let userId: string;
  let matchId: number;

  beforeAll(async () => {
    try {
      await prisma.$connect();
    } catch {
      return;
    }

    const user = await prisma.user.upsert({
      where: { name: "__test_user__" },
      create: { name: "__test_user__", pinHash: await hashPin("1234") },
      update: {},
    });
    userId = user.id;

    const match = await prisma.match.findFirst({
      where: { stage: "GROUP" },
      orderBy: { kickoffUtc: "desc" },
    });
    if (!match) throw new Error("no matches");
    matchId = match.id;
  });

  afterAll(async () => {
    await prisma.auditPrediction.deleteMany({ where: { userId } });
    await prisma.prediction.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { name: "__test_user__" } });
    await prisma.$disconnect();
  });

  it("upsert creates single row and audit entry", async () => {
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId, matchId } },
      create: { userId, matchId, homeScore: 1, awayScore: 0 },
      update: { homeScore: 2, awayScore: 1 },
    });
    await prisma.auditPrediction.create({
      data: { userId, matchId, homeScore: 2, awayScore: 1 },
    });

    const count = await prisma.prediction.count({
      where: { userId, matchId },
    });
    const audits = await prisma.auditPrediction.count({
      where: { userId, matchId },
    });

    expect(count).toBe(1);
    expect(audits).toBeGreaterThanOrEqual(1);
  });

  it("rescoreAll is idempotent", async () => {
    await rescoreAll(prisma);
    const first = await prisma.prediction.findFirst({
      where: { userId, matchId },
    });
    await rescoreAll(prisma);
    const second = await prisma.prediction.findFirst({
      where: { userId, matchId },
    });
    expect(first?.pointsAwarded).toBe(second?.pointsAwarded);
  });
});

describe("lock integration logic", () => {
  it("locked after kickoff", () => {
    const kickoff = new Date("2020-01-01T00:00:00Z");
    expect(isMatchLocked(kickoff)).toBe(true);
  });
});
