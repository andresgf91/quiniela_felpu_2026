import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user?.isAdmin) return null;
  return user;
}
