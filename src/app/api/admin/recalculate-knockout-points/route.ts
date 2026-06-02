import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { defaultScoring } from "@/data/defaultScoring";
import { calculateKnockoutMatchPredictionPoints } from "@/lib/scoring";
import type { KnockoutMatch, KnockoutMatchPrediction, LeaderboardEntry, ScoringSettings } from "@/types";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const db = adminDb();
  const callerSnap = await db.collection("users").doc(callerUid).get();
  if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado. Apenas admins podem recalcular pontos." }, { status: 403 });
  }

  const settingsSnap = await db.collection("scoringSettings").doc("main").get();
  const settings: ScoringSettings = settingsSnap.exists
    ? (settingsSnap.data() as ScoringSettings)
    : defaultScoring;

  const matchesSnap = await db.collection("knockoutMatches").where("status", "==", "finished").get();
  const finishedMatches = matchesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KnockoutMatch));

  const warnings: string[] = [];
  const knockoutPointsPerUser: Record<string, number> = {};
  let predictionsProcessed = 0;

  for (const match of finishedMatches) {
    if (!match.result90) {
      warnings.push(`${match.id} (M${match.matchNumber}): sem result90 — ignorado.`);
      continue;
    }
    if (!match.winnerTeamId) {
      warnings.push(`${match.id} (M${match.matchNumber}): sem winnerTeamId — ignorado.`);
      continue;
    }

    const predsSnap = await db.collection("matchPredictions").where("matchId", "==", match.id).get();

    for (const predDoc of predsSnap.docs) {
      const prediction = predDoc.data() as KnockoutMatchPrediction;
      const { points } = calculateKnockoutMatchPredictionPoints(prediction, match, settings.knockout);

      await db.collection("matchPredictions").doc(predDoc.id).set({ points }, { merge: true });

      const predUid = prediction.uid;
      knockoutPointsPerUser[predUid] = (knockoutPointsPerUser[predUid] ?? 0) + points;
      predictionsProcessed++;
    }
  }

  let usersUpdated = 0;
  for (const [predUid, rawKnockoutPoints] of Object.entries(knockoutPointsPerUser)) {
    const knockoutPoints = Number(rawKnockoutPoints.toFixed(1));

    const existingSnap = await db.collection("leaderboard").doc(predUid).get();
    const existing = existingSnap.exists ? (existingSnap.data() as LeaderboardEntry) : null;
    const initialPoints = existing?.initialPoints ?? 0;

    const userSnap = await db.collection("users").doc(predUid).get();
    const name: string = userSnap.exists
      ? ((userSnap.data()?.name as string) ?? (userSnap.data()?.email as string) ?? "Utilizador")
      : "Utilizador";

    const totalPoints = Number((initialPoints + knockoutPoints).toFixed(1));

    await db.collection("leaderboard").doc(predUid).set(
      {
        userId: predUid,
        name,
        initialPoints,
        knockoutPoints,
        totalPoints,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    usersUpdated++;
  }

  return NextResponse.json({
    success: true,
    matchesProcessed: finishedMatches.length,
    predictionsProcessed,
    usersUpdated,
    warnings,
  });
}
