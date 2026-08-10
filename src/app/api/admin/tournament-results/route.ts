import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { TournamentResults } from "@/types";

function cleanUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = cleanUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const db = adminDb();
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissoes de admin." }, { status: 403 });
  }

  let body: TournamentResults;
  try {
    body = (await req.json()) as TournamentResults;
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = cleanUndefined(body as unknown as Record<string, unknown>);
  payload.updatedAt = FieldValue.serverTimestamp();
  payload.updatedBy = uid;

  try {
    await db.collection("tournamentResults").doc("main").set(payload, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("[tournament-results] Firestore write failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
