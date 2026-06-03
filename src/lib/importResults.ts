import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { API_FOOTBALL_TEAM_NAMES } from "@/data/apiFootballTeamNames";
import type { KnockoutMatch, KnockoutResult90 } from "@/types";

// ── API-Football response types ───────────────────────────────────────────────

const TERMINAL_STATUSES = ["FT", "AET", "PEN"] as const;
type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

interface ApiGoals {
  home: number | null;
  away: number | null;
}

interface ApiFixtureEntry {
  fixture: {
    id: number;
    status: { short: string; long: string; elapsed: number | null };
    date: string;
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: ApiGoals;
  score: {
    halftime: ApiGoals;
    fulltime: ApiGoals;
    extratime: ApiGoals;
    penalty: ApiGoals;
  };
}

interface ApiFootballResponse {
  response: ApiFixtureEntry[];
  results: number;
}

// ── Public result types ───────────────────────────────────────────────────────

export type ResultsImportMatchStatus =
  | "updated"
  | "skipped_no_teams"
  | "not_terminal"
  | "no_match"
  | "ambiguous"
  | "failed";

export interface ResultsImportMatchResult {
  matchId: string;
  status: ResultsImportMatchStatus;
  warning?: string;
  result90?: KnockoutResult90;
  winnerTeamId?: string;
  winnerMappingWarning?: boolean;
  fixtureId?: number;
  apiStatusShort?: string;
}

export interface ResultsImportSummary {
  checked: number;
  updated: number;
  skipped: number;
  failed: number;
  warnings: string[];
  dryRun: boolean;
  results: ResultsImportMatchResult[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_TOLERANCE_MS = 3 * 60 * 60 * 1000; // ±3 h for fuzzy time matching
const API_BASE = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

// ── Pure helpers (exported for tests) ────────────────────────────────────────

export function normalizeApiTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveApiTeamId(apiName: string): string | null {
  return API_FOOTBALL_TEAM_NAMES[normalizeApiTeamName(apiName)] ?? null;
}

function isTerminal(s: string): s is TerminalStatus {
  return (TERMINAL_STATUSES as readonly string[]).includes(s);
}

// ── Fixture matching ──────────────────────────────────────────────────────────

type FindResult =
  | { found: true; fixture: ApiFixtureEntry; homeTeamIsTeamA: boolean }
  | { found: false; ambiguous: boolean; reason: string };

export function findMatchingFixture(
  match: KnockoutMatch,
  fixtures: ApiFixtureEntry[]
): FindResult {
  // Primary: exact fixture ID (admin-set or previously auto-populated)
  if (match.externalFixtureId) {
    const id = Number(match.externalFixtureId);
    const fx = fixtures.find((f) => f.fixture.id === id);
    if (!fx) {
      return {
        found: false,
        ambiguous: false,
        reason: `Fixture ID ${match.externalFixtureId} não encontrado na resposta da API`,
      };
    }
    // Determine orientation from team names; default to home=teamA if resolution fails
    const homeId = resolveApiTeamId(fx.teams.home.name);
    const awayId = resolveApiTeamId(fx.teams.away.name);
    const homeTeamIsTeamA =
      homeId === match.teamA && awayId === match.teamB ? true :
      homeId === match.teamB && awayId === match.teamA ? false :
      true; // best-effort default — winnerTeamId still resolved from .winner flag
    return { found: true, fixture: fx, homeTeamIsTeamA };
  }

  // Secondary: fuzzy match by team names + time window
  if (!match.teamA || !match.teamB) {
    return { found: false, ambiguous: false, reason: "Equipas não definidas" };
  }

  const startsMs = new Date(match.startsAt).getTime();
  const candidates: Array<{ fixture: ApiFixtureEntry; homeTeamIsTeamA: boolean }> = [];

  for (const fx of fixtures) {
    const homeId = resolveApiTeamId(fx.teams.home.name);
    const awayId = resolveApiTeamId(fx.teams.away.name);
    if (!homeId || !awayId) continue;

    let homeTeamIsTeamA: boolean;
    if (homeId === match.teamA && awayId === match.teamB) homeTeamIsTeamA = true;
    else if (homeId === match.teamB && awayId === match.teamA) homeTeamIsTeamA = false;
    else continue;

    const timeDiff = Math.abs(new Date(fx.fixture.date).getTime() - startsMs);
    if (timeDiff > TIME_TOLERANCE_MS) continue;

    candidates.push({ fixture: fx, homeTeamIsTeamA });
  }

  if (candidates.length === 1) return { found: true, ...candidates[0] };
  if (candidates.length > 1) {
    return {
      found: false,
      ambiguous: true,
      reason: `Correspondência ambígua: ${candidates.length} fixtures para ${match.teamA} vs ${match.teamB}`,
    };
  }
  return {
    found: false,
    ambiguous: false,
    reason: `Jogo ${match.teamA} vs ${match.teamB} não encontrado na API-Football`,
  };
}

// ── Result mapping ────────────────────────────────────────────────────────────

export interface MappedResult {
  result90: KnockoutResult90;
  resultFinal: { scoreTeamA: number; scoreTeamB: number };
  winnerTeamId: string | null;
  winnerMappingWarning: boolean;
  apiStatusShort: TerminalStatus;
}

export function mapFixtureToResult(
  fixture: ApiFixtureEntry,
  homeTeamIsTeamA: boolean,
  teamAId: string,
  teamBId: string
): MappedResult | null {
  const statusShort = fixture.fixture.status.short;
  if (!isTerminal(statusShort)) return null;

  const ft = fixture.score.fulltime;
  if (ft.home === null || ft.away === null) return null;

  // result90: from fulltime score comparison
  let result90: KnockoutResult90;
  if (ft.home > ft.away) {
    result90 = homeTeamIsTeamA ? "teamA" : "teamB";
  } else if (ft.home < ft.away) {
    result90 = homeTeamIsTeamA ? "teamB" : "teamA";
  } else {
    result90 = "draw";
  }

  // resultFinal: fulltime + extratime goals (AET/PEN adds ET goals)
  const et = fixture.score.extratime;
  let finalHome = ft.home;
  let finalAway = ft.away;
  if (statusShort === "AET" || statusShort === "PEN") {
    finalHome += et.home ?? 0;
    finalAway += et.away ?? 0;
  }
  const resultFinal = homeTeamIsTeamA
    ? { scoreTeamA: finalHome, scoreTeamB: finalAway }
    : { scoreTeamA: finalAway, scoreTeamB: finalHome };

  // winnerTeamId: from the API's explicit .winner flag (most reliable)
  let winnerTeamId: string | null = null;
  let winnerMappingWarning = false;

  const winnerApiName =
    fixture.teams.home.winner === true
      ? fixture.teams.home.name
      : fixture.teams.away.winner === true
      ? fixture.teams.away.name
      : null;

  if (winnerApiName) {
    const resolved = resolveApiTeamId(winnerApiName);
    if (resolved === teamAId || resolved === teamBId) {
      winnerTeamId = resolved;
    } else {
      winnerMappingWarning = true;
    }
  } else {
    winnerMappingWarning = true;
  }

  return { result90, resultFinal, winnerTeamId, winnerMappingWarning, apiStatusShort: statusShort };
}

// ── API fetch ─────────────────────────────────────────────────────────────────

async function fetchAllWcFixtures(apiKey: string): Promise<ApiFixtureEntry[]> {
  const url = new URL(`${API_BASE}/fixtures`);
  url.searchParams.set("league", String(WC_LEAGUE_ID));
  url.searchParams.set("season", String(WC_SEASON));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API-Football devolveu ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as ApiFootballResponse;
  return data.response ?? [];
}

// ── Main import function ──────────────────────────────────────────────────────

export async function importResults({
  db,
  dryRun = false,
}: {
  db: Firestore;
  dryRun?: boolean;
}): Promise<ResultsImportSummary> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error(
      "API_FOOTBALL_KEY não está configurada. Adicionar ao .env.local e às variáveis de ambiente do Vercel."
    );
  }

  const now = Date.now();

  // Read all knockout matches (max 32 — filter in memory, no composite index needed)
  const snap = await db.collection("knockoutMatches").get();
  const allMatches: KnockoutMatch[] = [];
  snap.forEach((doc) => {
    allMatches.push({ ...(doc.data() as KnockoutMatch), id: doc.id });
  });

  // Candidates: not finished, and kick-off already passed
  const candidates = allMatches.filter(
    (m) => m.status !== "finished" && new Date(m.startsAt).getTime() < now
  );
  const skippedCount = allMatches.length - candidates.length;

  if (candidates.length === 0) {
    return {
      checked: allMatches.length,
      updated: 0,
      skipped: skippedCount,
      failed: 0,
      warnings: [],
      dryRun,
      results: [],
    };
  }

  // Fetch all WC 2026 fixtures once
  let allFixtures: ApiFixtureEntry[];
  try {
    allFixtures = await fetchAllWcFixtures(apiKey);
  } catch (err) {
    throw new Error(
      `Falha ao chamar API-Football: ${err instanceof Error ? err.message : "Erro desconhecido"}`
    );
  }

  // Process each candidate
  const results: ResultsImportMatchResult[] = [];
  const warnings: string[] = [];
  let updated = 0;
  let failed = 0;

  for (const match of candidates) {
    const r = await processOneMatch({ match, allFixtures, db, dryRun });
    results.push(r);
    if (r.status === "updated") updated++;
    else if (r.status === "failed") failed++;
    if (r.warning) warnings.push(`${match.id}: ${r.warning}`);
  }

  return {
    checked: allMatches.length,
    updated,
    skipped: skippedCount,
    failed,
    warnings,
    dryRun,
    results,
  };
}

// ── Per-match processing ──────────────────────────────────────────────────────

async function processOneMatch({
  match,
  allFixtures,
  db,
  dryRun,
}: {
  match: KnockoutMatch;
  allFixtures: ApiFixtureEntry[];
  db: Firestore;
  dryRun: boolean;
}): Promise<ResultsImportMatchResult> {
  const matchId = match.id;

  if (!match.teamA || !match.teamB) {
    return { matchId, status: "skipped_no_teams" };
  }

  const found = findMatchingFixture(match, allFixtures);

  if (!found.found) {
    const warning = found.reason;
    if (!dryRun) {
      await safeUpdate(db, matchId, {
        externalSyncStatus: "failed",
        externalSyncError: warning.slice(0, 300),
      });
    }
    return { matchId, status: found.ambiguous ? "ambiguous" : "no_match", warning };
  }

  const { fixture, homeTeamIsTeamA } = found;

  // Not finished yet — skip without updating status
  if (!isTerminal(fixture.fixture.status.short)) {
    return {
      matchId,
      status: "not_terminal",
      apiStatusShort: fixture.fixture.status.short,
    };
  }

  const mapped = mapFixtureToResult(fixture, homeTeamIsTeamA, match.teamA, match.teamB);
  if (!mapped) {
    const warning = `Dados de resultado incompletos para ${matchId} (scores nulos)`;
    if (!dryRun) {
      await safeUpdate(db, matchId, {
        externalSyncStatus: "failed",
        externalSyncError: warning.slice(0, 300),
      });
    }
    return { matchId, status: "failed", warning };
  }

  const result: ResultsImportMatchResult = {
    matchId,
    status: "updated",
    result90: mapped.result90,
    winnerTeamId: mapped.winnerTeamId ?? undefined,
    winnerMappingWarning: mapped.winnerMappingWarning,
    fixtureId: fixture.fixture.id,
    apiStatusShort: mapped.apiStatusShort,
  };

  if (mapped.winnerMappingWarning) {
    result.warning = `winnerTeamId não mapeado — corrigir manualmente`;
  }

  if (dryRun) return result;

  const updateData: Record<string, unknown> = {
    status: "finished",
    result90: mapped.result90,
    resultFinal: mapped.resultFinal,
    externalProvider: "api-football",
    externalFixtureId: String(fixture.fixture.id),
    externalLastSyncAt: FieldValue.serverTimestamp(),
    externalSyncStatus: mapped.winnerMappingWarning ? "synced" : "synced",
    externalSyncError: mapped.winnerMappingWarning
      ? "winnerTeamId não mapeado: corrigir manualmente"
      : FieldValue.delete(),
  };

  if (mapped.winnerTeamId) {
    updateData.winnerTeamId = mapped.winnerTeamId;
  }

  try {
    await db.collection("knockoutMatches").doc(matchId).update(updateData);
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : "Erro desconhecido";
    return { matchId, status: "failed", warning: `Falha ao escrever no Firestore: ${msg}` };
  }

  return result;
}

async function safeUpdate(
  db: Firestore,
  matchId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection("knockoutMatches").doc(matchId).update(data);
  } catch {
    // best-effort: ignore write errors for status updates
  }
}
