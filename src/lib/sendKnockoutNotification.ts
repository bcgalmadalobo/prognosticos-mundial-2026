import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { KnockoutMatch } from "@/types";

export interface SendNotificationResult {
  sent: boolean;
  recipientCount: number;
  osData?: Record<string, unknown>;
}

/**
 * Sends a OneSignal push notification for a knockout match and updates the
 * match document and notificationLogs.
 *
 * Does NOT check notificationStatus before sending — callers are responsible
 * for any idempotency checks (the cron uses a transaction; the admin button
 * overrides unconditionally).
 */
export async function sendKnockoutNotification(
  matchId: string,
  match: KnockoutMatch,
  sentBy: string = "cron"
): Promise<SendNotificationResult> {
  const db = adminDb();

  const teamALabel = match.teamAName ?? match.slotA;
  const teamBLabel = match.teamBName ?? match.slotB;
  const title = "Jogo em 30 minutos!";
  const message = `${teamALabel} vs ${teamBLabel}: ainda vais a tempo de apostar.`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/jogos/${matchId}`;

  const usersSnap = await db.collection("users").get();
  const oneSignalIds: string[] = [];
  usersSnap.forEach((d) => {
    const id = d.data().oneSignalId as string | undefined;
    if (id) oneSignalIds.push(id);
  });

  if (oneSignalIds.length === 0) {
    await db.collection("knockoutMatches").doc(matchId).update({
      notificationStatus: "failed",
      notificationSentAt: FieldValue.serverTimestamp(),
      notificationError: "Nenhum utilizador tem notificacoes ativas.",
    });
    return { sent: false, recipientCount: 0 };
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

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

  const osData = (await osRes.json()) as Record<string, unknown>;
  const status = osRes.ok ? "sent" : "failed";

  const matchUpdate: Record<string, unknown> = {
    notificationStatus: status,
    notificationSentAt: FieldValue.serverTimestamp(),
  };
  if (!osRes.ok) {
    matchUpdate.notificationError = JSON.stringify(osData);
  }
  await db.collection("knockoutMatches").doc(matchId).update(matchUpdate);

  await db.collection("notificationLogs").add({
    sentAt: FieldValue.serverTimestamp(),
    sentBy,
    title,
    message,
    url,
    recipientCount: oneSignalIds.length,
    oneSignalResponse: osData,
    status,
    matchId,
  });

  return { sent: osRes.ok, recipientCount: oneSignalIds.length, osData };
}
