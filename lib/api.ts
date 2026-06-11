import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonUnauthorized() {
  return jsonError("No autorizado", 401);
}

export function jsonForbidden() {
  return jsonError("Acceso denegado", 403);
}

export function jsonConflict(message: string) {
  return jsonError(message, 409);
}
