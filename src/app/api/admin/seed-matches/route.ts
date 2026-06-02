import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { knockoutMatchesData } from "@/data/knockoutMatches";
import { notificationTime } from "@/lib/matchPredictionValidation";

// Fields that are always overwritten from static data (official metadata)
const STATIC_FIELDS = [
  "matchNumber", "round", "slotA", "slotB",
  "displayTimePortugal", "timezoneNote", "sourceNote",
  "venue", "city", "country",
] as const;

export async function POST(req: NextRequest) {
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

    let created = 0;
    let updated = 0;

    for (const match of knockoutMatchesData) {
      const ref = db.collection("knockoutMatches").doc(match.id);
      const snap = await ref.get();

      if (!snap.exists) {
        await ref.set({
          ...match,
          teamA: null,
          teamB: null,
          bettingOpen: false,
          status: "scheduled",
          timeTBD: false,
          notificationScheduledAt: notificationTime(match.startsAt),
          notificationStatus: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        created++;
      } else {
        // Update only static metadata – never touch operational fields
        const patch: Record<string, unknown> = {};
        for (const field of STATIC_FIELDS) {
          patch[field] = match[field];
        }
        await ref.update(patch);
        updated++;
      }
    }

    return NextResponse.json({ ok: true, created, updated, total: knockoutMatchesData.length });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
