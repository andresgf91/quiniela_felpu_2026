import { PrismaClient, Stage, MatchStatus } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { hashPin } from "../lib/auth/pin";
import { getGroupPin } from "../lib/auth/groupPin";
import type { FixtureData } from "../lib/types";

const prisma = new PrismaClient();

async function main() {
  const fixturePath = join(process.cwd(), "data", "worldcup2026.json");
  const fixture = JSON.parse(readFileSync(fixturePath, "utf-8")) as FixtureData;

  await prisma.auditPrediction.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.bracketPick.deleteMany();
  await prisma.quinielaReset.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  for (const team of fixture.teams) {
    await prisma.team.create({
      data: {
        id: team.id,
        nameEs: team.nameEs,
        nameEn: team.nameEn,
        flagEmoji: team.flagEmoji,
        groupCode: team.groupCode,
      },
    });
  }

  for (const m of fixture.matches) {
    const isGroup = m.stage === "GROUP";
    const homeTeamId = isGroup ? m.homeSlot : null;
    const awayTeamId = isGroup ? m.awaySlot : null;

    await prisma.match.create({
      data: {
        id: m.id,
        stage: m.stage as Stage,
        groupCode: m.groupCode,
        kickoffUtc: new Date(m.kickoffUtc),
        venue: m.venue,
        city: m.city,
        homeSlot: m.homeSlot,
        awaySlot: m.awaySlot,
        homeTeamId,
        awayTeamId,
        status: MatchStatus.SCHEDULED,
      },
    });
  }

  const adminNames = (process.env.ADMIN_NAMES ?? "admin").split(",").map((s) => s.trim());
  const pinHash = await hashPin(getGroupPin());

  const users = [
    { name: "admin", isAdmin: true },
    { name: "Ana", isAdmin: false },
    { name: "Carlos", isAdmin: false },
    { name: "María", isAdmin: false },
    { name: "Luis", isAdmin: false },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        pinHash,
        isAdmin: adminNames.includes(u.name) || u.isAdmin,
      },
    });
    createdUsers.push(user);
  }

  const groupMatches = fixture.matches.filter((m) => m.stage === "GROUP");

  for (const user of createdUsers) {
    for (let i = 0; i < groupMatches.length; i++) {
      const m = groupMatches[i];
      if (i % 3 === 0 && user.name !== "admin") continue;
      const homeScore = (i + user.name.length) % 4;
      const awayScore = (i * 2) % 3;
      await prisma.prediction.create({
        data: {
          userId: user.id,
          matchId: m.id,
          homeScore,
          awayScore,
        },
      });
    }
  }

  const m1 = fixture.matches[0];
  await prisma.match.update({
    where: { id: m1.id },
    data: {
      homeScore: 2,
      awayScore: 1,
      status: MatchStatus.FINISHED,
      resultSource: "ADMIN",
    },
  });

  console.log("Seed complete:", {
    teams: fixture.teams.length,
    matches: fixture.matches.length,
    users: createdUsers.length,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
