import { prisma } from "@/lib/db";
import { jsonOk, jsonUnauthorized, jsonForbidden, jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/admin";
import { hashPin } from "@/lib/auth/pin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    return session ? jsonForbidden() : jsonUnauthorized();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { predictions: true, resets: true } },
    },
    orderBy: { name: "asc" },
  });

  return jsonOk(users);
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    return session ? jsonForbidden() : jsonUnauthorized();
  }

  const { userId, newPin, remove } = await req.json();
  if (!userId) return jsonError("userId requerido", 400);

  if (remove) {
    await prisma.user.delete({ where: { id: userId } });
    return jsonOk({ removed: true });
  }

  if (newPin) {
    if (!/^\d{4,6}$/.test(newPin)) return jsonError("PIN inválido", 400);
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: await hashPin(newPin) },
    });
    return jsonOk({ pinReset: true });
  }

  return jsonError("Acción no válida", 400);
}
