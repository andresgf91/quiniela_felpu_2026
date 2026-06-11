import { prisma } from "@/lib/db";
import { jsonOk, jsonUnauthorized, jsonForbidden } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/admin";
import { rescoreAll } from "@/lib/scoring/rescoreAll";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    return session ? jsonForbidden() : jsonUnauthorized();
  }

  await rescoreAll(prisma);
  return jsonOk({ ok: true });
}
