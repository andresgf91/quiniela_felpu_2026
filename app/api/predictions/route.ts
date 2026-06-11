import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized, jsonError } from "@/lib/api";
import { isMatchLocked } from "@/lib/predictions/isLocked";

const MAX_RESETS = 2;

export async function DELETE() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const resetCount = await prisma.quinielaReset.count({
    where: { userId: session.userId },
  });

  if (resetCount >= MAX_RESETS) {
    return jsonError("Ya usaste las 2 oportunidades de borrar quiniela", 403);
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.userId },
    include: { match: true },
  });

  const openIds = predictions
    .filter((p) => !isMatchLocked(p.match.kickoffUtc))
    .map((p) => p.id);

  await prisma.prediction.deleteMany({
    where: { id: { in: openIds } },
  });

  await prisma.quinielaReset.create({
    data: { userId: session.userId },
  });

  await prisma.activityLog.create({
    data: { userId: session.userId, type: "QUINIELA_RESET" },
  });

  return jsonOk({
    deleted: openIds.length,
    resetsUsed: resetCount + 1,
    resetsRemaining: MAX_RESETS - resetCount - 1,
  });
}
