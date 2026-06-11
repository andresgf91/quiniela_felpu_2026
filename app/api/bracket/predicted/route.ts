import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";
import { getPredictedStandings } from "@/lib/standings/service";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const { tables } = await getPredictedStandings(prisma, session.userId);
  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const qualifiers: Record<string, string> = {};
  for (const [code, table] of Object.entries(tables)) {
    if (table[0]) qualifiers[`first_${code}`] = table[0].teamId;
    if (table[1]) qualifiers[`second_${code}`] = table[1].teamId;
    if (table[2]) qualifiers[`third_${code}`] = table[2].teamId;
  }

  return jsonOk({ qualifiers, teamMap });
}
