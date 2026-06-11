import { jsonOk, jsonUnauthorized, jsonForbidden } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/admin";
import { syncResults } from "@/lib/resultsSync";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    const session = await import("@/lib/auth/session").then((m) => m.getSession());
    return session ? jsonForbidden() : jsonUnauthorized();
  }

  const result = await syncResults();
  return jsonOk(result);
}
