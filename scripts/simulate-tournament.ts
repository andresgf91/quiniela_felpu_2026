import { PrismaClient, MatchStatus } from "@prisma/client";
import { enterMatchResult } from "../lib/matches/service";

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({ orderBy: { id: "asc" } });

  for (const match of matches) {
    if (match.homeTeamId && match.awayTeamId) {
      const homeScore = Math.floor(Math.random() * 3);
      const awayScore = Math.floor(Math.random() * 3);
      await enterMatchResult(prisma, match.id, {
        homeScore,
        awayScore,
        status: MatchStatus.FINISHED,
        resultSource: "ADMIN",
      });
      console.log(
        `Match ${match.id}: ${match.homeTeamId} ${homeScore}-${awayScore} ${match.awayTeamId}`,
      );
    }
  }

  console.log("Tournament simulation complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
