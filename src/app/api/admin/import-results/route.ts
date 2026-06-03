import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { importResults } from "@/lib/importResults";

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

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let dryRun = false;
  try {
    const body = (await req.json()) as { dryRun?: boolean };
    dryRun = body.dryRun === true;
  } catch {
    // body optional — default to dryRun=false
  }

  try {
    const summary = await importResults({ db: auth.db, dryRun });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
