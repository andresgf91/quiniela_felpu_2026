import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return jsonError("Database unavailable", 503);
  }
}
