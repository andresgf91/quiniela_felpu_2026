import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });

  return jsonOk(
    logs.map((l) => ({
      id: l.id,
      type: l.type,
      userName: l.user.name,
      createdAt: l.createdAt.toISOString(),
    })),
  );
}
