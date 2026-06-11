import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const DEFAULT_DEADLINE = "2026-06-11T19:45:00.000Z";

interface PredictionBody {
  groupPositions?: Record<string, string[]>;
  thirdPlaceRanking?: string[];
  qualifiedThirdPlacedTeams?: string[];
  roundOf32Teams?: string[];
  roundOf16Teams?: string[];
  quarterFinalTeams?: string[];
  semiFinalTeams?: string[];
  finalTeams?: string[];
  winner?: string;
  runnerUp?: string;
  thirdPlace?: string | null;
  fourthPlace?: string | null;
  topScorer?: string;
  bestPlayer?: string;
  bestYoungPlayer?: string;
  bestGoalkeeper?: string;
  bracketChoices?: Record<string, string | null>;
}

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

  // 2. Read appSettings/main — check status and deadline
  const db = adminDb();
  let deadlineStr = DEFAULT_DEADLINE;
  let predictionStatus: string | undefined;
  try {
    const settingsSnap = await db.collection("appSettings").doc("main").get();
    if (settingsSnap.exists) {
      const data = settingsSnap.data();
      if (typeof data?.initialPredictionDeadline === "string" && data.initialPredictionDeadline.length > 0) {
        deadlineStr = data.initialPredictionDeadline;
      }
      predictionStatus = data?.initialPredictionStatus;
    }
  } catch {
    // proceed with defaults
  }

  if (predictionStatus === "closed") {
    return NextResponse.json(
      { error: "A aposta inicial está fechada pelo administrador." },
      { status: 403 },
    );
  }

  if (Date.now() >= new Date(deadlineStr).getTime()) {
    return NextResponse.json(
      { error: "O prazo para submeter a aposta inicial terminou." },
      { status: 403 },
    );
  }

  // 3. Parse body
  let body: PredictionBody;
  try {
    body = (await req.json()) as PredictionBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const {
    groupPositions,
    thirdPlaceRanking,
    qualifiedThirdPlacedTeams,
    roundOf32Teams,
    roundOf16Teams,
    quarterFinalTeams,
    semiFinalTeams,
    finalTeams,
    winner,
    runnerUp,
    thirdPlace,
    fourthPlace,
    topScorer,
    bestPlayer,
    bestYoungPlayer,
    bestGoalkeeper,
    bracketChoices,
  } = body;

  // 4. Server-side validation
  const errors: string[] = [];

  if (!groupPositions || Object.keys(groupPositions).length !== 12)
    errors.push("groupPositions deve ter 12 grupos.");
  if (!thirdPlaceRanking || thirdPlaceRanking.length !== 12)
    errors.push("thirdPlaceRanking deve ter 12 equipas.");
  if (!qualifiedThirdPlacedTeams || qualifiedThirdPlacedTeams.length !== 8)
    errors.push("qualifiedThirdPlacedTeams deve ter 8 equipas.");
  if (!roundOf32Teams || roundOf32Teams.length !== 32)
    errors.push("roundOf32Teams deve ter 32 equipas.");
  if (!roundOf16Teams || roundOf16Teams.length !== 16)
    errors.push("roundOf16Teams deve ter 16 equipas.");
  if (!quarterFinalTeams || quarterFinalTeams.length !== 8)
    errors.push("quarterFinalTeams deve ter 8 equipas.");
  if (!semiFinalTeams || semiFinalTeams.length !== 4)
    errors.push("semiFinalTeams deve ter 4 equipas.");
  if (!finalTeams || finalTeams.length !== 2)
    errors.push("finalTeams deve ter 2 equipas.");
  if (!winner) errors.push("Vencedor em falta.");
  if (!runnerUp) errors.push("Finalista em falta.");
  if (!thirdPlace) errors.push("3.º lugar em falta.");
  if (!fourthPlace) errors.push("4.º lugar em falta.");
  if (!topScorer?.trim()) errors.push("Melhor marcador em falta.");
  if (!bestPlayer?.trim()) errors.push("Melhor jogador em falta.");
  if (!bestYoungPlayer?.trim()) errors.push("Melhor jogador jovem em falta.");
  if (!bestGoalkeeper?.trim()) errors.push("Melhor guarda-redes em falta.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
  }

  // 5. Atomic transaction: upsert prediction, preserving submittedAt on updates
  const predRef = db.collection("initialPredictions").doc(uid);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(predRef);
      const existingData = existing.data();

      tx.set(predRef, {
        userId: uid,
        groupPositions,
        thirdPlaceRanking,
        qualifiedThirdPlacedTeams,
        roundOf32Teams,
        roundOf16Teams,
        quarterFinalTeams,
        semiFinalTeams,
        finalTeams,
        winner,
        runnerUp,
        thirdPlace: thirdPlace ?? null,
        fourthPlace: fourthPlace ?? null,
        topScorer: topScorer!.trim(),
        bestPlayer: bestPlayer!.trim(),
        bestYoungPlayer: bestYoungPlayer!.trim(),
        bestGoalkeeper: bestGoalkeeper!.trim(),
        bracketChoices: bracketChoices ?? {},
        locked: false,
        submittedAt: existing.exists ? existingData!.submittedAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(userRef, { hasSubmittedInitialPrediction: true });
    });
  } catch {
    return NextResponse.json({ error: "Erro interno. Tenta novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
