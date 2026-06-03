import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { notificationTime } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchStatus, KnockoutResult90 } from "@/types";

interface Params { params: Promise<{ matchId: string }> }

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      value !== null &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: unknown }).toDate === "function"
    ) {
      result[key] = (value as { toDate(): Date }).toDate().toISOString();
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("Authorization")?.slice(7) ?? null;
  if (!token) return { error: "Nao autenticado.", status: 401 as const };
  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return { error: "Token invalido.", status: 401 as const };
  }
  const db = adminDb();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    return { error: "Sem permissoes.", status: 403 as const };
  }
  return { uid, db };
}

const VALID_STATUSES: KnockoutMatchStatus[] = ["scheduled", "live", "finished"];
const VALID_RESULT90: KnockoutResult90[] = ["teamA", "draw", "teamB"];

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await verifyAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { matchId } = await params;
    const snap = await auth.db.collection("knockoutMatches").doc(matchId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
    }
    return NextResponse.json({ match: { id: snap.id, ...serializeDoc(snap.data()!) } });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro interno.", details: e instanceof Error ? e.message : undefined },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await verifyAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { matchId } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body invalido." }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if ("teamA" in body) patch.teamA = body.teamA === "" ? null : (body.teamA ?? null);
    if ("teamB" in body) patch.teamB = body.teamB === "" ? null : (body.teamB ?? null);
    if ("teamAName" in body && body.teamAName !== undefined) patch.teamAName = String(body.teamAName);
    if ("teamBName" in body && body.teamBName !== undefined) patch.teamBName = String(body.teamBName);
    if ("bettingOpen" in body) patch.bettingOpen = Boolean(body.bettingOpen);

    if ("status" in body) {
      if (!VALID_STATUSES.includes(body.status as KnockoutMatchStatus)) {
        return NextResponse.json({ error: "status invalido." }, { status: 400 });
      }
      patch.status = body.status;
    }

    // Read current doc to enforce oddsLocked rules
    const existingSnap = await auth.db.collection("knockoutMatches").doc(matchId).get();
    const existing = existingSnap.exists ? (existingSnap.data() as KnockoutMatch) : null;

    const oddsAreEditable = existing?.oddsLocked !== true;

    if (oddsAreEditable) {
      if ("oddsTeamA" in body && body.oddsTeamA !== undefined) patch.oddsTeamA = Number(body.oddsTeamA);
      if ("oddsDraw" in body && body.oddsDraw !== undefined) patch.oddsDraw = Number(body.oddsDraw);
      if ("oddsTeamB" in body && body.oddsTeamB !== undefined) patch.oddsTeamB = Number(body.oddsTeamB);
    }

    if ("winnerTeamId" in body && body.winnerTeamId !== undefined) patch.winnerTeamId = String(body.winnerTeamId);

    if ("startsAt" in body && body.startsAt) {
      const startsAt = String(body.startsAt);
      patch.startsAt = startsAt;
      patch.notificationScheduledAt = notificationTime(startsAt);
    }

    if ("result90" in body && body.result90 !== undefined) {
      if (!VALID_RESULT90.includes(body.result90 as KnockoutResult90)) {
        return NextResponse.json({ error: "result90 invalido." }, { status: 400 });
      }
      patch.result90 = body.result90;
    }

    if ("resultFinal" in body && body.resultFinal !== null && body.resultFinal !== undefined) {
      const rf = body.resultFinal as { scoreTeamA?: unknown; scoreTeamB?: unknown };
      patch.resultFinal = {
        scoreTeamA: Number(rf.scoreTeamA),
        scoreTeamB: Number(rf.scoreTeamB),
      };
    }

    // Auto-tag as manual when admin sets odds + opens betting for the first time
    const hasManualOdds =
      (patch.oddsTeamA !== undefined && Number(patch.oddsTeamA) > 0) ||
      (patch.oddsDraw !== undefined && Number(patch.oddsDraw) > 0) ||
      (patch.oddsTeamB !== undefined && Number(patch.oddsTeamB) > 0);

    if (hasManualOdds && patch.bettingOpen === true && oddsAreEditable) {
      patch.oddsProvider = "manual";
      patch.oddsImportStatus = "manual";
      patch.oddsLocked = true;
      patch.bettingOpenedAt = FieldValue.serverTimestamp();
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    await auth.db.collection("knockoutMatches").doc(matchId).set(patch, { merge: true });

    const updated = await auth.db.collection("knockoutMatches").doc(matchId).get();
    return NextResponse.json({ ok: true, match: { id: updated.id, ...serializeDoc(updated.data()!) } });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro interno.", details: e instanceof Error ? e.message : undefined },
      { status: 500 }
    );
  }
}
