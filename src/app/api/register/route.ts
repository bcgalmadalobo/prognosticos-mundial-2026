import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  let uid: string | undefined;

  try {
    const body = await req.json() as {
      name?: string;
      email?: string;
      password?: string;
      phoneNumber?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phoneNumber = body.phoneNumber?.trim();

    if (!name || !email || !password || !phoneNumber) {
      return NextResponse.json({ error: "Todos os campos sao obrigatorios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A password deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const auth = adminAuth();
    const db = adminDb();

    try {
      const userRecord = await auth.createUser({ email, password, displayName: name });
      uid = userRecord.uid;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-exists") || msg.includes("EMAIL_EXISTS")) {
        return NextResponse.json({ error: "Este email ja esta registado." }, { status: 400 });
      }
      return NextResponse.json({ error: "Erro ao criar conta. Verifica o email e tenta novamente." }, { status: 400 });
    }

    try {
      await db.collection("users").doc(uid!).set({
        uid,
        name,
        email,
        phoneNumber,
        role: "user",
        approved: false,
        status: "pending_access_code",
        hasSubmittedInitialPrediction: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      await auth.deleteUser(uid!).catch(() => undefined);
      uid = undefined;
      return NextResponse.json({ error: "Erro ao criar conta. Tenta novamente." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    if (uid) {
      await adminAuth().deleteUser(uid).catch(() => undefined);
    }
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
