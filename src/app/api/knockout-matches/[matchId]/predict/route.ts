import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  validateKnockoutPrediction,
  requiresFinalScore,
  bettingDeadline,
} from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchPrediction, KnockoutResult90 } from "@/types";

interface Params { params: Promise<{ matchId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const token = req.headers.get("Authorization")?.slice(7) ?? null;
    if (!token) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    let uid: string;
    try {
      uid = (await adminAuth().verifyIdToken(token)).uid;
    } catch {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const { matchId } = await params;
    const db = adminDb();
    const snap = await db.collection("matchPredictions").doc(`${uid}_${matchId}`).get();
    if (!snap.exists) return NextResponse.json({ prediction: null });
    return NextResponse.json({ prediction: snap.data() as KnockoutMatchPrediction });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const token = req.headers.get("Authorization")?.slice(7) ?? null;
    if (!token) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    let uid: string;
    try {
      uid = (await adminAuth().verifyIdToken(token)).uid;
    } catch {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const { matchId } = await params;
    const db = adminDb();

    const matchSnap = await db.collection("knockoutMatches").doc(matchId).get();
    if (!matchSnap.exists) {
      return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
    }
    const match = matchSnap.data() as KnockoutMatch;

    if (!match.bettingOpen) {
      return NextResponse.json({ error: "Apostas fechadas para este jogo." }, { status: 403 });
    }
    if (Date.now() >= bettingDeadline(match.startsAt).getTime()) {
      return NextResponse.json({ error: "Prazo de aposta expirou (15 min antes do inicio)." }, { status: 403 });
    }
    if (!match.teamA || !match.teamB) {
      return NextResponse.json({ error: "Equipas ainda nao definidas para este jogo." }, { status: 422 });
    }

    const body = await req.json() as {
      result90?: unknown;
      qualifierTeamId?: unknown;
      scoreFinalTeamA?: unknown;
      scoreFinalTeamB?: unknown;
    };

    const result90 = body.result90 as KnockoutResult90;
    const qualifierTeamId = String(body.qualifierTeamId ?? "").trim();

    if (!["teamA", "draw", "teamB"].includes(result90)) {
      return NextResponse.json({ error: "result90 invalido." }, { status: 400 });
    }

    const needsFinal = requiresFinalScore(match.round);
    const scoreFinalTeamA = needsFinal ? Number(body.scoreFinalTeamA) : undefined;
    const scoreFinalTeamB = needsFinal ? Number(body.scoreFinalTeamB) : undefined;

    const validationError = validateKnockoutPrediction(
      { result90, qualifierTeamId, scoreFinalTeamA, scoreFinalTeamB },
      match.teamA,
      match.teamB,
      match.round
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }

    const docId = `${uid}_${matchId}`;
    const existing = await db.collection("matchPredictions").doc(docId).get();

    const prediction: Omit<KnockoutMatchPrediction, "submittedAt" | "updatedAt"> & {
      submittedAt?: unknown;
      updatedAt: unknown;
    } = {
      uid,
      matchId,
      round: match.round,
      result90,
      qualifierTeamId,
      ...(needsFinal && scoreFinalTeamA !== undefined ? { scoreFinalTeamA } : {}),
      ...(needsFinal && scoreFinalTeamB !== undefined ? { scoreFinalTeamB } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!existing.exists) {
      prediction.submittedAt = FieldValue.serverTimestamp();
    }

    await db.collection("matchPredictions").doc(docId).set(prediction, { merge: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
