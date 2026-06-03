import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { ODDS_API_TEAM_NAMES } from "@/data/oddsApiTeamNames";
import type { KnockoutMatch } from "@/types";

// ── The Odds API response types ───────────────────────────────────────────────

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

// ── Public result types ───────────────────────────────────────────────────────

export type OddsImportMatchStatus =
  | "imported"
  | "skipped"
  | "locked"
  | "no_teams"
  | "no_match"
  | "ambiguous"
  | "no_odds"
  | "failed";

export interface OddsImportMatchResult {
  matchId: string;
  status: OddsImportMatchStatus;
  warning?: string;
  odds?: { oddsTeamA: number; oddsDraw: number; oddsTeamB: number };
  bookmaker?: string;
  eventId?: string;
}

export interface OddsImportSummary {
  checked: number;
  eligible: number;
  imported: number;
  skipped: number;
  failed: number;
  warnings: string[];
  dryRun: boolean;
  results: OddsImportMatchResult[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PREFERRED_BOOKMAKERS = [
  "bet365", "unibet", "pinnacle", "betfair_ex_eu", "williamhill", "bwin", "nordicbet",
];

const BETTING_WINDOW_MS = 24 * 60 * 60 * 1000;        // 24 h
const API_QUERY_BUFFER_MS = 1 * 60 * 60 * 1000;       // +1 h extra on API window
const TIME_TOLERANCE_MS = 3 * 60 * 60 * 1000;         // ±3 h for time matching

// ── Pure helpers (exported for tests) ────────────────────────────────────────

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveApiTeamName(apiName: string): string | null {
  return ODDS_API_TEAM_NAMES[normalizeTeamName(apiName)] ?? null;
}

type FindResult =
  | { found: true; event: OddsApiEvent; teamAIsHome: boolean }
  | { found: false; ambiguous: boolean };

export function findMatchingApiEvent(
  teamAId: string,
  teamBId: string,
  startsAtIso: string,
  events: OddsApiEvent[]
): FindResult {
  const startsMs = new Date(startsAtIso).getTime();
  const candidates: Array<{ event: OddsApiEvent; teamAIsHome: boolean }> = [];

  for (const event of events) {
    const homeId = resolveApiTeamName(event.home_team);
    const awayId = resolveApiTeamName(event.away_team);
    if (!homeId || !awayId) continue;

    let teamAIsHome: boolean;
    if (homeId === teamAId && awayId === teamBId) teamAIsHome = true;
    else if (homeId === teamBId && awayId === teamAId) teamAIsHome = false;
    else continue;

    const timeDiff = Math.abs(new Date(event.commence_time).getTime() - startsMs);
    if (timeDiff > TIME_TOLERANCE_MS) continue;

    candidates.push({ event, teamAIsHome });
  }

  if (candidates.length === 1) return { found: true, ...candidates[0] };
  if (candidates.length > 1) return { found: false, ambiguous: true };
  return { found: false, ambiguous: false };
}

interface ExtractedOdds {
  oddsTeamA: number;
  oddsDraw: number;
  oddsTeamB: number;
  bookmaker: string;
}

export function extractOdds(event: OddsApiEvent, teamAIsHome: boolean): ExtractedOdds | null {
  const teamAApiName = teamAIsHome ? event.home_team : event.away_team;
  const teamBApiName = teamAIsHome ? event.away_team : event.home_team;

  const sorted = [...event.bookmakers].sort((a, b) => {
    const ai = PREFERRED_BOOKMAKERS.indexOf(a.key);
    const bi = PREFERRED_BOOKMAKERS.indexOf(b.key);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  for (const bk of sorted) {
    const h2h = bk.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;

    const aPrice = h2h.outcomes.find((o) => o.name === teamAApiName)?.price ?? 0;
    const dPrice = h2h.outcomes.find((o) => o.name === "Draw")?.price ?? 0;
    const bPrice = h2h.outcomes.find((o) => o.name === teamBApiName)?.price ?? 0;

    // All three odds must be > 1 (sanity check against bad data)
    if (aPrice <= 1 || dPrice <= 1 || bPrice <= 1) continue;

    return {
      oddsTeamA: Math.round(aPrice * 100) / 100,
      oddsDraw:  Math.round(dPrice * 100) / 100,
      oddsTeamB: Math.round(bPrice * 100) / 100,
      bookmaker: bk.key,
    };
  }

  return null;
}

// ── Main import function ──────────────────────────────────────────────────────

export async function importOdds({
  db,
  dryRun = false,
}: {
  db: Firestore;
  dryRun?: boolean;
}): Promise<OddsImportSummary> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ODDS_API_KEY não está configurada. Adicionar ao .env.local e às variáveis de ambiente do Vercel."
    );
  }

  // 1. Read all matches (max 32, filter in memory — no composite index needed)
  const snap = await db.collection("knockoutMatches").get();
  const now = Date.now();
  const windowEnd = now + BETTING_WINDOW_MS + API_QUERY_BUFFER_MS;

  const eligible: KnockoutMatch[] = [];
  snap.forEach((doc) => {
    const m = doc.data() as KnockoutMatch;
    const startMs = new Date(m.startsAt).getTime();
    if (
      m.status === "scheduled" &&
      m.oddsLocked !== true &&
      m.bettingOpen !== true &&
      m.teamA != null &&
      m.teamB != null &&
      startMs >= now &&
      startMs <= windowEnd
    ) {
      eligible.push({ ...m, id: doc.id } as KnockoutMatch);
    }
  });

  const skippedCount = snap.size - eligible.length;

  if (eligible.length === 0) {
    return {
      checked: snap.size,
      eligible: 0,
      imported: 0,
      skipped: skippedCount,
      failed: 0,
      warnings: [],
      dryRun,
      results: [],
    };
  }

  // 2. Fetch odds from The Odds API
  const fromIso = new Date(now).toISOString();
  const toIso = new Date(windowEnd).toISOString();

  const url = new URL("https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "eu");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("commenceTimeFrom", fromIso);
  url.searchParams.set("commenceTimeTo", toIso);

  let apiEvents: OddsApiEvent[];
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Odds API devolveu ${res.status}: ${text.slice(0, 200)}`);
    }
    apiEvents = (await res.json()) as OddsApiEvent[];
  } catch (err) {
    throw new Error(
      `Falha ao chamar The Odds API: ${err instanceof Error ? err.message : "Erro desconhecido"}`
    );
  }

  // 3. Process each eligible match
  const results: OddsImportMatchResult[] = [];
  const warnings: string[] = [];
  let imported = 0;
  let failed = 0;

  for (const match of eligible) {
    const r = await processOneMatch({ match, apiEvents, db, dryRun });
    results.push(r);
    if (r.status === "imported") imported++;
    else if (r.status === "failed") failed++;
    if (r.warning) warnings.push(`${match.id}: ${r.warning}`);
  }

  return {
    checked: snap.size,
    eligible: eligible.length,
    imported,
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
  apiEvents,
  db,
  dryRun,
}: {
  match: KnockoutMatch;
  apiEvents: OddsApiEvent[];
  db: Firestore;
  dryRun: boolean;
}): Promise<OddsImportMatchResult> {
  const matchId = match.id;

  // Find API event
  const found = findMatchingApiEvent(match.teamA!, match.teamB!, match.startsAt, apiEvents);

  if (!found.found) {
    const warning = found.ambiguous
      ? `Correspondência ambígua para ${match.teamA} vs ${match.teamB} — odds não importadas`
      : `Jogo ${match.teamA} vs ${match.teamB} não encontrado na Odds API`;

    if (!dryRun) {
      await safeUpdate(db, matchId, {
        oddsImportStatus: "failed",
        oddsImportError: warning.slice(0, 200),
      });
    }

    return {
      matchId,
      status: found.ambiguous ? "ambiguous" : "no_match",
      warning,
    };
  }

  // Extract odds from preferred bookmaker
  const odds = extractOdds(found.event, found.teamAIsHome);

  if (!odds) {
    const warning = `Nenhum bookmaker com odds completas para ${match.teamA} vs ${match.teamB}`;

    if (!dryRun) {
      await safeUpdate(db, matchId, {
        oddsImportStatus: "failed",
        oddsImportError: warning.slice(0, 200),
      });
    }

    return { matchId, status: "no_odds", warning };
  }

  const result: OddsImportMatchResult = {
    matchId,
    status: "imported",
    odds: { oddsTeamA: odds.oddsTeamA, oddsDraw: odds.oddsDraw, oddsTeamB: odds.oddsTeamB },
    bookmaker: odds.bookmaker,
    eventId: found.event.id,
  };

  if (dryRun) return result;

  // Guard: re-read before writing (concurrent cron protection)
  const freshSnap = await db.collection("knockoutMatches").doc(matchId).get();
  if (!freshSnap.exists) {
    return { matchId, status: "failed", warning: "Documento não encontrado antes de escrever" };
  }
  const fresh = freshSnap.data() as KnockoutMatch;
  if (fresh.oddsLocked === true) {
    return { matchId, status: "locked" };
  }

  try {
    await db.collection("knockoutMatches").doc(matchId).update({
      oddsTeamA: odds.oddsTeamA,
      oddsDraw: odds.oddsDraw,
      oddsTeamB: odds.oddsTeamB,
      bettingOpen: true,
      bettingOpenedAt: FieldValue.serverTimestamp(),
      oddsLocked: true,
      oddsImportedAt: FieldValue.serverTimestamp(),
      oddsProvider: "the-odds-api",
      oddsSourceBookmaker: odds.bookmaker,
      oddsExternalEventId: found.event.id,
      oddsImportStatus: "imported",
      oddsImportError: FieldValue.delete(),
    });
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
    // best-effort: ignore write errors for failure status updates
  }
}
