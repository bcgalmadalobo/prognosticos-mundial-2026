import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    let adminUid: string;
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      adminUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const db = adminDb();
    const adminSnap = await db.collection("users").doc(adminUid).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Sem permissoes." }, { status: 403 });
    }

    const body = await req.json() as { uid?: string; email?: string; name?: string };
    const { uid, email, name } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "uid e email sao obrigatorios." }, { status: 400 });
    }

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Utilizador nao encontrado." }, { status: 404 });
    }
    if (userSnap.data()?.approved === true) {
      return NextResponse.json({ error: "Utilizador ja esta aprovado." }, { status: 400 });
    }

    const code = generateCode();

    await db.collection("invites").add({
      code,
      uid,
      expectedEmail: email,
      expectedName: name ?? "",
      used: false,
      createdBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
