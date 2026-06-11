import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validation/prediction";
import { verifyPin } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rateLimit";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos", 400);

  const { name, pin } = parsed.data;
  const rateKey = `login:${name}`;
  const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return jsonError("Demasiados intentos. Intenta más tarde.", 429);
  }

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user || !(await verifyPin(pin, user.pinHash))) {
    return jsonError("Nombre o PIN incorrectos", 401);
  }

  resetRateLimit(rateKey);
  await createSession({ userId: user.id, name: user.name });
  return jsonOk({ id: user.id, name: user.name, isAdmin: user.isAdmin });
}
