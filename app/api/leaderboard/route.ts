import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";
import { computeLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const leaderboard = await computeLeaderboard(prisma);
  return jsonOk(leaderboard);
}
