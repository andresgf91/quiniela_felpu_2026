import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";
import { getRealStandings } from "@/lib/standings/service";
import { prisma as db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const tables = await getRealStandings(prisma);
  const teams = await db.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const enriched = Object.fromEntries(
    Object.entries(tables).map(([code, rows]) => [
      code,
      rows.map((r, i) => ({
        ...r,
        position: i + 1,
        team: teamMap[r.teamId],
        zone: i < 2 ? "qualified" : i === 2 ? "third" : "out",
      })),
    ]),
  );

  return jsonOk(enriched);
}
