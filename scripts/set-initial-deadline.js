// One-shot script: update appSettings/main.initialPredictionDeadline in Firestore.
// Run with: node --env-file=.env.local scripts/set-initial-deadline.js

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const NEW_DEADLINE = "2026-06-11T19:00:00.000Z";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function main() {
  const app = getAdminApp();
  const db = getFirestore(app);
  const ref = db.collection("appSettings").doc("main");

  await ref.set({ initialPredictionDeadline: NEW_DEADLINE }, { merge: true });

  const snap = await ref.get();
  const data = snap.data();
  console.log("✓ appSettings/main guardado:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
