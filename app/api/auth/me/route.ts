import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, isAdmin: true, avatarUrl: true, soulTeamId: true },
  });

  if (!user) return jsonUnauthorized();
  return jsonOk(user);
}
