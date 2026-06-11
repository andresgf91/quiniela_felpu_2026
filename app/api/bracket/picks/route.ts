import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const picks = await prisma.bracketPick.findMany({
    where: { userId: session.userId },
  });

  const teams = await prisma.team.findMany();
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  return jsonOk(
    picks.map((p) => ({
      slot: p.slot,
      teamId: p.teamId,
      team: teamMap[p.teamId],
    })),
  );
}
