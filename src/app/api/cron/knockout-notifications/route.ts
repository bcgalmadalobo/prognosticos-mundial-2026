import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendKnockoutNotification } from "@/lib/sendKnockoutNotification";
import type { KnockoutMatch } from "@/types";

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("Authorization") === `Bearer ${secret}`;
}

async function runCron(): Promise<NextResponse> {
  const db = adminDb();
  const now = new Date();
  const nowIso = now.toISOString();

  // Single range inequality on notificationScheduledAt avoids composite index issues.
  // startsAt > now and notificationStatus checks are applied in memory.
  const snap = await db
    .collection("knockoutMatches")
    .where("status", "==", "scheduled")
    .where("bettingOpen", "==", true)
    .where("notificationScheduledAt", "<=", nowIso)
    .get();

  const candidates = snap.docs.filter((d) => {
    const data = d.data() as KnockoutMatch;
    // Must not have started yet
    if (data.startsAt <= nowIso) return false;
    // Skip if already processed (missing field = eligible, treat as pending)
    const ns = data.notificationStatus;
    return ns !== "sent" && ns !== "sending" && ns !== "failed";
  });

  const results: Array<{ matchId: string; result: string }> = [];

  for (const doc of candidates) {
    const matchId = doc.id;

    // Optimistic lock: atomically transition "pending/unset" → "sending"
    let shouldSend = false;
    try {
      await db.runTransaction(async (tx) => {
        const ref = db.collection("knockoutMatches").doc(matchId);
        const fresh = await tx.get(ref);
        if (!fresh.exists) return;
        const ns = (fresh.data() as KnockoutMatch).notificationStatus;
        if (ns === "sent" || ns === "sending" || ns === "failed") return;
        tx.update(ref, { notificationStatus: "sending" });
        shouldSend = true;
      });
    } catch {
      results.push({ matchId, result: "transaction-failed" });
      continue;
    }

    if (!shouldSend) {
      results.push({ matchId, result: "skipped" });
      continue;
    }

    try {
      const match = doc.data() as KnockoutMatch;
      const res = await sendKnockoutNotification(matchId, match, "cron");
      results.push({ matchId, result: res.sent ? "sent" : "failed" });
    } catch (e) {
      await db
        .collection("knockoutMatches")
        .doc(matchId)
        .update({
          notificationStatus: "failed",
          notificationError: e instanceof Error ? e.message : "Unknown error",
        })
        .catch(() => undefined);
      results.push({ matchId, result: "error" });
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: nowIso,
    checked: snap.docs.length,
    candidates: candidates.length,
    results,
  });
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  try {
    return await runCron();
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  try {
    return await runCron();
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
