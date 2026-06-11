import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized, jsonConflict, jsonError } from "@/lib/api";
import { predictionBodySchema } from "@/lib/validation/prediction";
import { isMatchLocked } from "@/lib/predictions/isLocked";
import { checkRateLimit } from "@/lib/auth/rateLimit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const rate = checkRateLimit(`pred:${session.userId}`, 30, 60 * 1000);
  if (!rate.allowed) return jsonError("Demasiadas solicitudes", 429);

  const { matchId: matchIdStr } = await params;
  const matchId = parseInt(matchIdStr, 10);
  if (isNaN(matchId)) return jsonError("Partido inválido", 400);

  const body = await req.json();
  const parsed = predictionBodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Marcador inválido", 400);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return jsonError("Partido no encontrado", 404);

  if (isMatchLocked(match.kickoffUtc)) {
    return jsonConflict("Este partido ya está cerrado 🔒");
  }

  if (
    match.stage !== "GROUP" &&
    (!match.homeTeamId || !match.awayTeamId)
  ) {
    return jsonConflict("Equipos aún no definidos para este partido");
  }

  const { homeScore, awayScore, advancingTeamId } = parsed.data;

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: { userId: session.userId, matchId },
    },
    create: {
      userId: session.userId,
      matchId,
      homeScore,
      awayScore,
      advancingTeamId: advancingTeamId ?? null,
    },
    update: {
      homeScore,
      awayScore,
      advancingTeamId: advancingTeamId ?? null,
    },
  });

  await prisma.auditPrediction.create({
    data: {
      userId: session.userId,
      matchId,
      homeScore,
      awayScore,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      type: "PREDICTIONS_UPDATED",
    },
  });

  return jsonOk(prediction);
}
