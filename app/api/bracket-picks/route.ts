import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized, jsonConflict, jsonError } from "@/lib/api";
import { bracketPicksSchema } from "@/lib/validation/prediction";

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const match73 = await prisma.match.findUnique({ where: { id: 73 } });
  if (match73 && new Date() >= match73.kickoffUtc) {
    return jsonConflict("El bracket ya está cerrado (partido #73 iniciado)");
  }

  const body = await req.json();
  const parsed = bracketPicksSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos", 400);

  for (const pick of parsed.data.picks) {
    await prisma.bracketPick.upsert({
      where: {
        userId_slot: { userId: session.userId, slot: pick.slot },
      },
      create: {
        userId: session.userId,
        slot: pick.slot,
        teamId: pick.teamId,
      },
      update: { teamId: pick.teamId },
    });
  }

  await prisma.activityLog.create({
    data: { userId: session.userId, type: "BRACKET_UPDATED" },
  });

  return jsonOk({ saved: parsed.data.picks.length });
}
