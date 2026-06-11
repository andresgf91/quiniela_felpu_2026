import { jsonOk, jsonError, jsonUnauthorized, jsonForbidden } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/admin";
import { adminResultSchema } from "@/lib/validation/prediction";
import { enterMatchResult } from "@/lib/matches/service";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    return session ? jsonForbidden() : jsonUnauthorized();
  }

  const { matchId: matchIdStr } = await params;
  const matchId = parseInt(matchIdStr, 10);
  if (isNaN(matchId)) return jsonError("Partido inválido", 400);

  const body = await req.json();
  const parsed = adminResultSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos", 400);

  try {
    const updated = await enterMatchResult(prisma, matchId, {
      ...parsed.data,
      resultSource: "ADMIN",
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        type: "RESULT_ENTERED",
      },
    });

    return jsonOk(updated);
  } catch {
    return jsonError("No se pudo guardar el resultado", 500);
  }
}
