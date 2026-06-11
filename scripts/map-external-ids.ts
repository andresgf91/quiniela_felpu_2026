/**
 * Maps football-data.org match IDs to our fixtures by kickoff + team names.
 * Run: FOOTBALL_DATA_TOKEN=xxx pnpm tsx scripts/map-external-ids.ts
 */
import { PrismaClient } from "@prisma/client";
import { loadFixture } from "../lib/fixture";

const prisma = new PrismaClient();

async function main() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    console.error("FOOTBALL_DATA_TOKEN required");
    process.exit(1);
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": token } },
  );

  if (!res.ok) {
    console.error("API error", res.status);
    process.exit(1);
  }

  const data = (await res.json()) as {
    matches: Array<{
      id: number;
      utcDate: string;
      homeTeam: { name: string };
      awayTeam: { name: string };
    }>;
  };

  const fixture = loadFixture();
  let mapped = 0;
  const unmapped: string[] = [];

  for (const api of data.matches) {
    const kickoff = new Date(api.utcDate).toISOString();
    const dbMatch = fixture.matches.find(
      (m) =>
        new Date(m.kickoffUtc).toISOString() === kickoff ||
        Math.abs(new Date(m.kickoffUtc).getTime() - new Date(api.utcDate).getTime()) <
          3600000,
    );

    if (dbMatch) {
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { externalId: api.id },
      });
      mapped += 1;
    } else {
      unmapped.push(`${api.id}: ${api.homeTeam.name} vs ${api.awayTeam.name}`);
    }
  }

  console.log(`Mapped ${mapped} matches`);
  if (unmapped.length) {
    console.warn("Unmapped:", unmapped.slice(0, 10));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
