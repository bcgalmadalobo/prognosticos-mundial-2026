import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { sendKnockoutNotification } from "@/lib/sendKnockoutNotification";
import type { KnockoutMatch } from "@/types";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = process.env.CRON_SECRET;

  if (!secret || !token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = adminDb();
  const now = new Date();

  // Read all knockout matches — max 32, filter in memory, no composite index needed
  const snap = await db.collection("knockoutMatches").get();
  const checked = snap.size;

  const eligibleIds: string[] = [];
  snap.forEach((doc) => {
    const m = doc.data() as KnockoutMatch;
    if (
      m.bettingOpen === true &&
      m.status === "scheduled" &&
      m.notificationStatus !== "sent" &&
      m.notificationScheduledAt != null &&
      new Date(m.notificationScheduledAt) <= now &&
      new Date(m.startsAt) > now
    ) {
      eligibleIds.push(doc.id);
    }
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const matchId of eligibleIds) {
    // Re-read fresh before acting — guards against concurrent cron runs
    const freshSnap = await db.collection("knockoutMatches").doc(matchId).get();
    if (!freshSnap.exists) { skipped++; continue; }

    const fresh = freshSnap.data() as KnockoutMatch;
    if (fresh.notificationStatus === "sent") { skipped++; continue; }

    await db.collection("knockoutMatches").doc(matchId).update({
      notificationStatus: "sending",
    });

    try {
      await sendKnockoutNotification(matchId, fresh, "cron");
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      await db.collection("knockoutMatches").doc(matchId).update({
        notificationStatus: "failed",
        notificationError: msg.slice(0, 200),
        notificationSentAt: FieldValue.serverTimestamp(),
      });
      failed++;
      errors.push(`${matchId}: ${msg.slice(0, 100)}`);
    }
  }

  return NextResponse.json({ checked, eligible: eligibleIds.length, sent, skipped, failed, errors });
}
