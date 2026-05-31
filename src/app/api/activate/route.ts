import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json() as { code?: string };
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Codigo obrigatorio." }, { status: 400 });
    }

    const db = adminDb();

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Utilizador nao encontrado." }, { status: 404 });
    }
    const userData = userSnap.data()!;

    if (userData.approved === true) {
      return NextResponse.json({ error: "Conta ja ativada." }, { status: 400 });
    }

    const invitesSnap = await db
      .collection("invites")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (invitesSnap.empty) {
      return NextResponse.json({ error: "Codigo de acesso invalido." }, { status: 400 });
    }

    const inviteRef = invitesSnap.docs[0].ref;
    const inviteData = invitesSnap.docs[0].data();

    // Reject if code was generated for a different user
    if (inviteData.uid && inviteData.uid !== uid) {
      return NextResponse.json({ error: "Este codigo nao pertence a esta conta." }, { status: 400 });
    }
    if (inviteData.expectedEmail && inviteData.expectedEmail !== userData.email) {
      return NextResponse.json({ error: "Este codigo nao pertence a esta conta." }, { status: 400 });
    }

    try {
      await db.runTransaction(async (tx) => {
        const freshInvite = await tx.get(inviteRef);
        if (!freshInvite.exists) throw new Error("Codigo de acesso invalido.");
        if (freshInvite.data()?.used) throw new Error("Este codigo ja foi utilizado.");
        if (freshInvite.data()?.uid && freshInvite.data()?.uid !== uid) {
          throw new Error("Este codigo nao pertence a esta conta.");
        }

        tx.update(inviteRef, {
          used: true,
          usedByUserId: uid,
          usedAt: FieldValue.serverTimestamp(),
        });

        tx.update(db.collection("users").doc(uid), {
          approved: true,
          status: "approved",
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ativar.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
