import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { defaultScoring } from "@/data/defaultScoring";
import type {
  AppSettings,
  AppUser,
  InitialPrediction,
  Invite,
  KnockoutMatch,
  KnockoutMatchPrediction,
  LeaderboardEntry,
  Match,
  MatchPrediction,
  ScoringSettings,
  Team,
  TournamentResults,
} from "@/types";

function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = cleanUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export async function upsertUser(user: AppUser) {
  const payload = cleanUndefined({ ...user } as unknown as Record<string, unknown>);
  if (!payload.createdAt) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(doc(db, "users", user.uid), payload, { merge: true });
}

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as AppUser) : null;
}

export async function listUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("name", "asc")));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function listTeams() {
  const snap = await getDocs(query(collection(db, "teams"), orderBy("name", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));
}

export async function saveTeam(team: Team) {
  const payload = cleanUndefined({ ...team } as unknown as Record<string, unknown>);
  await setDoc(doc(db, "teams", team.id), payload, { merge: true });
}

export async function listMatches(status?: Match["status"]) {
  const ref = collection(db, "matches");
  const q = status ? query(ref, where("status", "==", status)) : query(ref);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
}

export async function saveMatch(match: Match) {
  const payload = cleanUndefined({ ...match } as unknown as Record<string, unknown>);
  await setDoc(doc(db, "matches", match.id), payload, { merge: true });
}

export async function saveMatchResult(matchId: string, updates: Partial<Match>) {
  const payload = cleanUndefined({ ...updates } as unknown as Record<string, unknown>);
  await setDoc(doc(db, "matches", matchId), payload, { merge: true });
}

export async function getInitialPrediction(userId: string) {
  const snap = await getDocs(query(collection(db, "initialPredictions"), where("userId", "==", userId)));
  const first = snap.docs[0];
  return first ? ({ id: first.id, ...first.data() } as InitialPrediction) : null;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(db, "appSettings", "main"));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
  await setDoc(doc(db, "appSettings", "main"), settings, { merge: true });
}

export async function saveInitialPrediction(prediction: InitialPrediction) {
  const id = prediction.id ?? prediction.userId;
  const payload = cleanUndefined({ ...prediction } as unknown as Record<string, unknown>);
  delete payload.id;
  payload.locked = true;
  payload.submittedAt = serverTimestamp();

  await setDoc(doc(db, "initialPredictions", id), payload, { merge: true });
}

export async function saveMatchPrediction(prediction: MatchPrediction) {
  const id = prediction.id ?? `${prediction.userId}_${prediction.matchId}`;
  const payload = cleanUndefined({ ...prediction } as unknown as Record<string, unknown>);
  delete payload.id;
  payload.locked = true;
  payload.submittedAt = serverTimestamp();

  await setDoc(doc(db, "matchPredictions", id), payload, { merge: true });
}

export async function listMatchPredictions() {
  const snap = await getDocs(collection(db, "matchPredictions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchPrediction));
}

export async function listLeaderboard() {
  const snap = await getDocs(query(collection(db, "leaderboard"), orderBy("totalPoints", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardEntry));
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry) {
  const payload = cleanUndefined({ ...entry } as unknown as Record<string, unknown>);
  delete payload.id;
  payload.updatedAt = serverTimestamp();

  await setDoc(doc(db, "leaderboard", entry.userId), payload, { merge: true });
}

export async function getLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(doc(db, "leaderboard", userId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as LeaderboardEntry) : null;
}

export async function getTournamentResults(): Promise<TournamentResults | null> {
  const snap = await getDoc(doc(db, "tournamentResults", "main"));
  return snap.exists() ? (snap.data() as TournamentResults) : null;
}

export async function saveTournamentResults(results: TournamentResults): Promise<void> {
  const payload = cleanUndefined({ ...results } as unknown as Record<string, unknown>);
  payload.updatedAt = serverTimestamp();
  await setDoc(doc(db, "tournamentResults", "main"), payload, { merge: true });
}

export async function getScoringSettings(): Promise<ScoringSettings> {
  const snap = await getDoc(doc(db, "scoringSettings", "main"));
  if (snap.exists()) return snap.data() as ScoringSettings;
  return defaultScoring;
}

export async function saveScoringSettings(settings: ScoringSettings): Promise<void> {
  await setDoc(doc(db, "scoringSettings", "main"), settings, { merge: true });
}

export async function updateOneSignalId(uid: string, oneSignalId: string) {
  await updateDoc(doc(db, "users", uid), { oneSignalId });
}

export async function createInvite(invite: Omit<Invite, "id">) {
  const ref = doc(collection(db, "invites"));
  const payload = cleanUndefined({ ...invite } as unknown as Record<string, unknown>);
  payload.createdAt = serverTimestamp();
  await setDoc(ref, payload);
  return ref.id;
}

export async function listInvites() {
  const snap = await getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite));
}

// ── Knockout matches ──────────────────────────────────────────────────────────

export async function listKnockoutMatches(): Promise<KnockoutMatch[]> {
  const snap = await getDocs(
    query(collection(db, "knockoutMatches"), orderBy("matchNumber", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KnockoutMatch));
}

export async function getKnockoutMatch(matchId: string): Promise<KnockoutMatch | null> {
  const snap = await getDoc(doc(db, "knockoutMatches", matchId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as KnockoutMatch) : null;
}

export async function updateKnockoutMatch(
  matchId: string,
  updates: Partial<KnockoutMatch>
): Promise<void> {
  const payload = cleanUndefined({ ...updates } as unknown as Record<string, unknown>);
  await setDoc(doc(db, "knockoutMatches", matchId), payload, { merge: true });
}

export async function getKnockoutMatchPrediction(
  uid: string,
  matchId: string
): Promise<KnockoutMatchPrediction | null> {
  const snap = await getDoc(doc(db, "matchPredictions", `${uid}_${matchId}`));
  return snap.exists() ? (snap.data() as KnockoutMatchPrediction) : null;
}

export async function listUserKnockoutPredictions(uid: string): Promise<KnockoutMatchPrediction[]> {
  const snap = await getDocs(
    query(collection(db, "matchPredictions"), where("uid", "==", uid))
  );
  return snap.docs.map((d) => d.data() as KnockoutMatchPrediction);
}
