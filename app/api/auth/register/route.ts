import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validation/prediction";
import { hashPin } from "@/lib/auth/pin";
import { isValidGroupPin } from "@/lib/auth/groupPin";
import { createSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Datos inválidos", 400);
  }

  const { inviteCode, name, pin } = parsed.data;

  if (inviteCode !== process.env.INVITE_CODE) {
    return jsonError("Código de invitación incorrecto", 403);
  }

  if (!isValidGroupPin(pin)) {
    return jsonError("PIN del grupo incorrecto", 403);
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) return jsonError("Ese nombre ya está registrado", 409);

  const adminNames = (process.env.ADMIN_NAMES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const user = await prisma.user.create({
    data: {
      name,
      pinHash: await hashPin(pin),
      isAdmin: adminNames.includes(name),
    },
  });

  await createSession({ userId: user.id, name: user.name });
  return jsonOk({ id: user.id, name: user.name, isAdmin: user.isAdmin });
}
