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

    const body = await req.json() as { title?: string; message?: string; url?: string };
    const { title, message, url } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Titulo e mensagem sao obrigatorios." },
        { status: 400 }
      );
    }

    const usersSnap = await db.collection("users").get();
    const oneSignalIds: string[] = [];
    usersSnap.forEach((doc) => {
      const id = doc.data().oneSignalId as string | undefined;
      if (id) oneSignalIds.push(id);
    });

    if (oneSignalIds.length === 0) {
      await db.collection("notificationLogs").add({
        sentAt: FieldValue.serverTimestamp(),
        sentBy: adminUid,
        title: title.trim(),
        message: message.trim(),
        ...(url?.trim() ? { url: url.trim() } : {}),
        recipientCount: 0,
        oneSignalResponse: {},
        status: "failed",
      });
      return NextResponse.json({
        sent: false,
        message: "Nenhum utilizador tem notificacoes ativas.",
      });
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    const osPayload: Record<string, unknown> = {
      app_id: appId,
      target_channel: "push",
      headings: { en: title.trim(), pt: title.trim() },
      contents: { en: message.trim(), pt: message.trim() },
      include_subscription_ids: oneSignalIds,
    };
    if (url?.trim()) osPayload.url = url.trim();

    const osRes = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        Authorization: `Key ${restApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(osPayload),
    });

    const osData = await osRes.json() as Record<string, unknown>;

    await db.collection("notificationLogs").add({
      sentAt: FieldValue.serverTimestamp(),
      sentBy: adminUid,
      title: title.trim(),
      message: message.trim(),
      ...(url?.trim() ? { url: url.trim() } : {}),
      recipientCount: oneSignalIds.length,
      oneSignalResponse: osData,
      status: osRes.ok ? "sent" : "failed",
    });

    if (!osRes.ok) {
      return NextResponse.json(
        { error: "Erro da OneSignal.", detail: osData },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sent: true,
      recipientCount: oneSignalIds.length,
      oneSignalNotificationId: osData.id,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }
}
