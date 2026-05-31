import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { defaultScoring } from "@/data/defaultScoring";
import { calculateInitialPredictionPoints } from "@/lib/scoring";
import type { InitialActuals, InitialPrediction, LeaderboardEntry, ScoringSettings, TournamentResults } from "@/types";

export async function POST(req: NextRequest) {
  // 1. Verify bearer token
  const authorization = req.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  // 2. Confirm admin role server-side
  const db = adminDb();
  const callerSnap = await db.collection("users").doc(uid).get();
  if (!callerSnap.exists || callerSnap.data()?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado. Apenas admins podem recalcular pontos." }, { status: 403 });
  }

  // 3. Read tournament results (all fields optional — partial results score partial points)
  const resultsSnap = await db.collection("tournamentResults").doc("main").get();
  const raw: TournamentResults = resultsSnap.exists ? (resultsSnap.data() as TournamentResults) : {};

  const actuals: InitialActuals = {
    groupPositions: raw.groupPositions ?? {},
    roundOf32Teams: raw.roundOf32Teams ?? [],
    roundOf16Teams: raw.roundOf16Teams ?? [],
    quarterFinalTeams: raw.quarterFinalTeams ?? [],
    semiFinalTeams: raw.semiFinalTeams ?? [],
    finalTeams: raw.finalTeams ?? [],
    winner: raw.winner ?? "",
    runnerUp: raw.runnerUp ?? "",
    thirdPlace: raw.thirdPlace ?? "",
    fourthPlace: raw.fourthPlace ?? "",
    topScorer: raw.topScorer ?? "",
    bestPlayer: raw.bestPlayer ?? "",
    bestYoungPlayer: raw.bestYoungPlayer ?? "",
    bestGoalkeeper: raw.bestGoalkeeper ?? "",
  };

  // 4. Read scoring settings — fallback to hardcoded defaults if collection is empty
  const settingsSnap = await db.collection("scoringSettings").doc("main").get();
  const settings: ScoringSettings = settingsSnap.exists
    ? (settingsSnap.data() as ScoringSettings)
    : defaultScoring;

  // 5. Read all submitted initial predictions
  const predictionsSnap = await db.collection("initialPredictions").get();
  const predictions = predictionsSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as InitialPrediction)
  );

  // 6. Recalculate and write — preserve existing knockoutPoints
  let updated = 0;
  for (const prediction of predictions) {
    const { points } = calculateInitialPredictionPoints(prediction, actuals, settings.initial);
    const predUserId = prediction.userId;

    // Preserve existing knockoutPoints
    const existingSnap = await db.collection("leaderboard").doc(predUserId).get();
    const existing = existingSnap.exists ? (existingSnap.data() as LeaderboardEntry) : null;
    const knockoutPoints = existing?.knockoutPoints ?? 0;

    // Resolve display name
    const userSnap = await db.collection("users").doc(predUserId).get();
    const name: string = userSnap.exists
      ? ((userSnap.data()?.name as string) ?? (userSnap.data()?.email as string) ?? "Utilizador")
      : "Utilizador";

    const totalPoints = Number((points + knockoutPoints).toFixed(1));

    await db.collection("leaderboard").doc(predUserId).set(
      {
        userId: predUserId,
        name,
        initialPoints: points,
        knockoutPoints,
        totalPoints,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    updated += 1;
  }

  return NextResponse.json({ success: true, updated });
}
