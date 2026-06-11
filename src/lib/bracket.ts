// Pure bracket logic — no Firestore calls, no side effects.
//
// Third-place slot resolution uses a static lookup table (src/data/thirdPlaceAllocation.ts).
// The table covers all C(12,8)=495 combinations of 8 qualified third-place groups.

import { getThirdPlaceAssignment, THIRD_PLACE_SLOT_IDS } from "@/data/thirdPlaceAllocation";
import type { ThirdPlaceMatchId } from "@/data/thirdPlaceAllocation";
import { GROUP_LETTERS, TEAMS } from "@/data/worldcup2026";
import type {
  BracketMatchState,
  BracketMatchTemplate,
  BracketRound,
  BracketState,
  DerivedRoundTeams,
  SlotDef,
} from "@/types";

// ── Template builder helpers ─────────────────────────────────────────────────

function mt(
  id: string,
  round: BracketRound,
  slotA: SlotDef,
  slotB: SlotDef,
  winnerNextMatchId: string | null,
  winnerNextSlot: "A" | "B",
  loserNextMatchId: string | null = null,
  loserNextSlot: "A" | "B" = "A",
): BracketMatchTemplate {
  return { id, round, slotA, slotB, winnerNextMatchId, winnerNextSlot, loserNextMatchId, loserNextSlot };
}

const s1 = (group: string): SlotDef => ({ type: "1st", group });
const s2 = (group: string): SlotDef => ({ type: "2nd", group });
const s3 = (...groups: string[]): SlotDef => ({ type: "3rd", allowedGroups: groups });
const sw = (matchId: string): SlotDef => ({ type: "winner", matchId });
const sl = (matchId: string): SlotDef => ({ type: "loser", matchId });

// ── Official bracket template (M73–M104) ─────────────────────────────────────

export const BRACKET_TEMPLATE: BracketMatchTemplate[] = [
  // Round of 32 — ESPN/FIFA 2026 official bracket
  mt("M73",  "round_of_32",  s2("A"),              s2("B"),              "M90",  "B"),
  mt("M74",  "round_of_32",  s1("E"),              s3("A","B","C","D","F"), "M90",  "A"),
  mt("M75",  "round_of_32",  s1("F"),              s2("C"),              "M91",  "A"),
  mt("M76",  "round_of_32",  s1("C"),              s2("F"),              "M94",  "A"),
  mt("M77",  "round_of_32",  s1("I"),              s3("C","D","F","G","H"), "M89",  "A"),
  mt("M78",  "round_of_32",  s2("E"),              s2("I"),              "M94",  "B"),
  mt("M79",  "round_of_32",  s1("A"),              s3("C","E","F","H","I"), "M93",  "A"),
  mt("M80",  "round_of_32",  s1("L"),              s3("E","H","I","J","K"), "M93",  "B"),
  mt("M81",  "round_of_32",  s1("D"),              s3("B","E","F","I","J"), "M92",  "A"),
  mt("M82",  "round_of_32",  s1("G"),              s3("A","E","H","I","J"), "M92",  "B"),
  mt("M83",  "round_of_32",  s2("K"),              s2("L"),              "M89",  "B"),
  mt("M84",  "round_of_32",  s1("H"),              s2("J"),              "M91",  "B"),
  mt("M85",  "round_of_32",  s1("B"),              s3("E","F","G","I","J"), "M96",  "B"),
  mt("M86",  "round_of_32",  s1("J"),              s2("H"),              "M96",  "A"),
  mt("M87",  "round_of_32",  s1("K"),              s3("D","E","I","J","L"), "M95",  "B"),
  mt("M88",  "round_of_32",  s2("D"),              s2("G"),              "M95",  "A"),

  // Round of 16 — ESPN/FIFA 2026 official bracket
  mt("M89",  "round_of_16",  sw("M77"), sw("M83"), "M97",  "A"),
  mt("M90",  "round_of_16",  sw("M74"), sw("M73"), "M97",  "B"),
  mt("M91",  "round_of_16",  sw("M75"), sw("M84"), "M99",  "A"),
  mt("M92",  "round_of_16",  sw("M81"), sw("M82"), "M99",  "B"),
  mt("M93",  "round_of_16",  sw("M79"), sw("M80"), "M98",  "A"),
  mt("M94",  "round_of_16",  sw("M76"), sw("M78"), "M98",  "B"),
  mt("M95",  "round_of_16",  sw("M88"), sw("M87"), "M100", "A"),
  mt("M96",  "round_of_16",  sw("M86"), sw("M85"), "M100", "B"),

  // Quarter Finals
  mt("M97",  "quarter_final", sw("M89"), sw("M90"), "M101", "A"),
  mt("M98",  "quarter_final", sw("M93"), sw("M94"), "M101", "B"),
  mt("M99",  "quarter_final", sw("M91"), sw("M92"), "M102", "A"),
  mt("M100", "quarter_final", sw("M95"), sw("M96"), "M102", "B"),

  // Semi Finals — winners go to M104 (Final), losers go to M103 (3rd place)
  mt("M101", "semi_final", sw("M97"),  sw("M98"),  "M104", "A", "M103", "A"),
  mt("M102", "semi_final", sw("M99"),  sw("M100"), "M104", "B", "M103", "B"),

  // 3rd Place — receives losers of semi-finals
  mt("M103", "third_place", sl("M101"), sl("M102"), null, "A"),

  // Final — receives winners of semi-finals
  mt("M104", "final",       sw("M101"), sw("M102"), null, "A"),
];

const TEMPLATE_MAP: Record<string, BracketMatchTemplate> = Object.fromEntries(
  BRACKET_TEMPLATE.map((t) => [t.id, t]),
);

// ── Slot label (shown when a team is not yet resolved) ────────────────────────

function slotLabel(slot: SlotDef): string {
  switch (slot.type) {
    case "1st":    return `1.º Gr. ${slot.group}`;
    case "2nd":    return `2.º Gr. ${slot.group}`;
    case "3rd":    return "Por resolver";
    case "winner": return `Venc. ${slot.matchId}`;
    case "loser":  return `Perd. ${slot.matchId}`;
  }
}

// ── Individual slot resolution ────────────────────────────────────────────────

function resolveSlot(
  slot: SlotDef,
  matchId: string,
  groupOrders: Record<string, string[]>,
  thirdAssignment: Record<string, string | null>,
  resolved: Record<string, BracketMatchState>,
): string | null {
  switch (slot.type) {
    case "1st":
      return groupOrders[slot.group]?.[0] ?? null;
    case "2nd":
      return groupOrders[slot.group]?.[1] ?? null;
    case "3rd":
      return thirdAssignment[matchId] ?? null;
    case "winner": {
      const match = resolved[slot.matchId];
      return match?.winnerId ?? null;
    }
    case "loser": {
      const match = resolved[slot.matchId];
      if (!match?.winnerId || !match.teamA || !match.teamB) return null;
      return match.winnerId === match.teamA ? match.teamB : match.teamA;
    }
  }
}

// ── resolveBracket ────────────────────────────────────────────────────────────

export function resolveBracket(
  groupOrders: Record<string, string[]>,
  thirdPlaceRanking: string[],
  bracketChoices: Record<string, string | null>,
): BracketState {
  // Build groupOf: teamId → group letter (from 3rd position in each group)
  const groupOf: Record<string, string> = {};
  GROUP_LETTERS.forEach((g) => {
    const third = groupOrders[g]?.[2];
    if (third) groupOf[third] = g;
  });

  const qualifiedThirds = thirdPlaceRanking.slice(0, 8);
  const qualifiedGroups = qualifiedThirds
    .map((t) => groupOf[t])
    .filter((g): g is string => !!g);

  // Pre-compute third-place assignment via static lookup (no greedy/matching at runtime)
  const thirdAssignment: Record<string, string | null> = {};
  let thirdAssignmentError = false;

  if (qualifiedGroups.length === 8) {
    try {
      const assignment = getThirdPlaceAssignment(qualifiedGroups);
      const groupToTeam: Record<string, string> = {};
      for (const teamId of qualifiedThirds) {
        const group = groupOf[teamId];
        if (group) groupToTeam[group] = teamId;
      }
      for (const slotId of THIRD_PLACE_SLOT_IDS) {
        const group = assignment[slotId as ThirdPlaceMatchId];
        thirdAssignment[slotId] = groupToTeam[group] ?? null;
      }
    } catch {
      thirdAssignmentError = true;
    }
  }

  const resolved: Record<string, BracketMatchState> = {};

  for (const tmpl of BRACKET_TEMPLATE) {
    const teamA = resolveSlot(tmpl.slotA, tmpl.id, groupOrders, thirdAssignment, resolved);
    const teamB = resolveSlot(tmpl.slotB, tmpl.id, groupOrders, thirdAssignment, resolved);

    // Validate stored winner: if the chosen team is no longer in this match, treat as null
    const stored = bracketChoices[tmpl.id] ?? null;
    const winnerId = (stored === teamA || stored === teamB) ? stored : null;

    resolved[tmpl.id] = {
      id: tmpl.id,
      round: tmpl.round,
      teamA,
      teamB,
      labelA: teamA ? (TEAMS[teamA]?.name ?? teamA) : slotLabel(tmpl.slotA),
      labelB: teamB ? (TEAMS[teamB]?.name ?? teamB) : slotLabel(tmpl.slotB),
      winnerId,
    };
  }

  return { matches: resolved, thirdAssignmentError };
}

// ── applyChoice ───────────────────────────────────────────────────────────────

function collectDownstream(matchId: string): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function dfs(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    result.push(id);
    const tmpl = TEMPLATE_MAP[id];
    if (!tmpl) return;
    if (tmpl.winnerNextMatchId) dfs(tmpl.winnerNextMatchId);
    if (tmpl.loserNextMatchId) dfs(tmpl.loserNextMatchId);
  }

  const tmpl = TEMPLATE_MAP[matchId];
  if (tmpl?.winnerNextMatchId) dfs(tmpl.winnerNextMatchId);
  if (tmpl?.loserNextMatchId) dfs(tmpl.loserNextMatchId);

  return result;
}

export function applyChoice(
  choices: Record<string, string | null>,
  matchId: string,
  winnerId: string | null,
): Record<string, string | null> {
  if ((choices[matchId] ?? null) === winnerId) return choices;

  const next: Record<string, string | null> = { ...choices, [matchId]: winnerId };
  for (const id of collectDownstream(matchId)) {
    next[id] = null;
  }
  return next;
}

// ── deriveRoundTeams ──────────────────────────────────────────────────────────

export function deriveRoundTeams(state: BracketState): DerivedRoundTeams {
  const m = state.matches;

  const winnersOf = (ids: string[]): string[] => {
    const out: string[] = [];
    for (const id of ids) {
      const w = m[id]?.winnerId;
      if (w) out.push(w);
    }
    return out;
  };

  const participantsOf = (ids: string[]): string[] => {
    const out: string[] = [];
    for (const id of ids) {
      const match = m[id];
      if (match?.teamA) out.push(match.teamA);
      if (match?.teamB) out.push(match.teamB);
    }
    return out;
  };

  const loserOf = (matchId: string): string | null => {
    const match = m[matchId];
    if (!match?.winnerId || !match.teamA || !match.teamB) return null;
    return match.winnerId === match.teamA ? match.teamB : match.teamA;
  };

  const winner = m["M104"]?.winnerId ?? null;
  const thirdPlace = m["M103"]?.winnerId ?? null;

  return {
    roundOf32Teams: participantsOf(["M73","M74","M75","M76","M77","M78","M79","M80","M81","M82","M83","M84","M85","M86","M87","M88"]),
    roundOf16Teams: winnersOf(["M73","M74","M75","M76","M77","M78","M79","M80","M81","M82","M83","M84","M85","M86","M87","M88"]),
    quarterFinalTeams: winnersOf(["M89","M90","M91","M92","M93","M94","M95","M96"]),
    semiFinalTeams: winnersOf(["M97","M98","M99","M100"]),
    finalTeams: winnersOf(["M101","M102"]),
    winner,
    runnerUp: winner ? loserOf("M104") : null,
    thirdPlace,
    fourthPlace: thirdPlace ? loserOf("M103") : null,
  };
}
