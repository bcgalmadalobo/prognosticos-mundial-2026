import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendKnockoutNotification } from "@/lib/sendKnockoutNotification";
import type { KnockoutMatch } from "@/types";

interface Params { params: Promise<{ matchId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const token = req.headers.get("Authorization")?.slice(7) ?? null;
    if (!token) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    let adminUid: string;
    try {
      adminUid = (await adminAuth().verifyIdToken(token)).uid;
    } catch {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const db = adminDb();
    const adminSnap = await db.collection("users").doc(adminUid).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Sem permissoes." }, { status: 403 });
    }

    const { matchId } = await params;
    const matchSnap = await db.collection("knockoutMatches").doc(matchId).get();
    if (!matchSnap.exists) {
      return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
    }

    const match = matchSnap.data() as KnockoutMatch;
    const result = await sendKnockoutNotification(matchId, match, adminUid);

    if (!result.sent && result.recipientCount === 0) {
      return NextResponse.json({ sent: false, message: "Nenhum utilizador tem notificacoes ativas." });
    }
    if (!result.sent) {
      return NextResponse.json({ error: "Erro da OneSignal.", detail: result.osData }, { status: 502 });
    }

    return NextResponse.json({ sent: true, recipientCount: result.recipientCount });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
