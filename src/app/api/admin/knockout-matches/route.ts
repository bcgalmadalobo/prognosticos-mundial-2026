import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      value !== null &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: unknown }).toDate === "function"
    ) {
      result[key] = (value as { toDate(): Date }).toDate().toISOString();
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("Authorization")?.slice(7) ?? null;
  if (!token) return { error: "Nao autenticado.", status: 401 as const };
  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return { error: "Token invalido.", status: 401 as const };
  }
  const db = adminDb();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    return { error: "Sem permissoes.", status: 403 as const };
  }
  return { uid, db };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const snap = await auth.db
      .collection("knockoutMatches")
      .orderBy("matchNumber", "asc")
      .get();
    const matches = snap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }));
    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro interno.", details: e instanceof Error ? e.message : undefined },
      { status: 500 }
    );
  }
}
