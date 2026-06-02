import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendKnockoutNotification } from "@/lib/sendKnockoutNotification";
import type { KnockoutMatch } from "@/types";

function isCronAuthorized(req: NextRequest): "ok" | "missing-secret" | "wrong-secret" {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "missing-secret";
  return req.headers.get("Authorization") === `Bearer ${secret}` ? "ok" : "wrong-secret";
}

// Accepts Firestore Timestamp objects, ISO strings, or null/undefined safely.
function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toDate" in (value as object)) {
    return (value as { toDate(): Date }).toDate().toISOString();
  }
  return null;
}

async function runCron(): Promise<NextResponse> {
  const db = adminDb();
  const now = new Date();
  const nowIso = now.toISOString();

  // Single-field inequality only — avoids requiring a composite Firestore index.
  // status, bettingOpen, and startsAt checks are applied in memory below.
  const snap = await db
    .collection("knockoutMatches")
    .where("notificationScheduledAt", "<=", nowIso)
    .get();

  const candidates = snap.docs.filter((d) => {
    const data = d.data() as KnockoutMatch;
    if (data.status !== "scheduled") return false;
    if (!data.bettingOpen) return false;
    // Must not have started yet
    const startsAt = toIsoString(data.startsAt);
    if (!startsAt || startsAt <= nowIso) return false;
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
  const authResult = isCronAuthorized(req);
  if (authResult !== "ok") {
    if (authResult === "missing-secret") {
      console.warn("[cron knockout notifications] CRON_SECRET not configured");
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
    }
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  try {
    return await runCron();
  } catch (error) {
    console.error("[cron knockout notifications]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = isCronAuthorized(req);
  if (authResult !== "ok") {
    if (authResult === "missing-secret") {
      console.warn("[cron knockout notifications] CRON_SECRET not configured");
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
    }
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  try {
    return await runCron();
  } catch (error) {
    console.error("[cron knockout notifications]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
