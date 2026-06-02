import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
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

    const teamALabel = match.teamAName ?? match.slotA;
    const teamBLabel = match.teamBName ?? match.slotB;
    const title = `Jogo em 30 minutos!`;
    const message = `${teamALabel} vs ${teamBLabel} — Faz a tua aposta antes que feche!`;
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/jogos/${matchId}`;

    const usersSnap = await db.collection("users").get();
    const oneSignalIds: string[] = [];
    usersSnap.forEach((d) => {
      const id = d.data().oneSignalId as string | undefined;
      if (id) oneSignalIds.push(id);
    });

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (oneSignalIds.length === 0) {
      await db.collection("knockoutMatches").doc(matchId).update({
        notificationSentAt: FieldValue.serverTimestamp(),
        notificationStatus: "failed",
      });
      return NextResponse.json({ sent: false, message: "Nenhum utilizador tem notificacoes ativas." });
    }

    const osPayload: Record<string, unknown> = {
      app_id: appId,
      target_channel: "push",
      headings: { en: title, pt: title },
      contents: { en: message, pt: message },
      include_subscription_ids: oneSignalIds,
      url,
    };

    const osRes = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        Authorization: `Key ${restApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(osPayload),
    });

    const osData = await osRes.json() as Record<string, unknown>;
    const status = osRes.ok ? "sent" : "failed";

    await db.collection("knockoutMatches").doc(matchId).update({
      notificationSentAt: FieldValue.serverTimestamp(),
      notificationStatus: status,
    });

    await db.collection("notificationLogs").add({
      sentAt: FieldValue.serverTimestamp(),
      sentBy: adminUid,
      title,
      message,
      url,
      recipientCount: oneSignalIds.length,
      oneSignalResponse: osData,
      status,
      matchId,
    });

    if (!osRes.ok) {
      return NextResponse.json({ error: "Erro da OneSignal.", detail: osData }, { status: 502 });
    }

    return NextResponse.json({ sent: true, recipientCount: oneSignalIds.length });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
