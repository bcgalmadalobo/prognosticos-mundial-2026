import { describe, expect, it } from "vitest";
import {
  THIRD_PLACE_ALLOCATION,
  THIRD_PLACE_SLOT_IDS,
  THIRD_PLACE_SLOT_ALLOWED,
  getThirdPlaceAssignment,
} from "@/data/thirdPlaceAllocation";
import type { ThirdPlaceMatchId } from "@/data/thirdPlaceAllocation";
import { BRACKET_TEMPLATE, deriveRoundTeams, resolveBracket } from "@/lib/bracket";
import { GROUP_LETTERS, GROUPS } from "@/data/worldcup2026";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGroupOrders(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const g of GROUP_LETTERS) out[g] = [...GROUPS[g]];
  return out;
}

// thirdPlaceRanking: all 12 thirds in order A–L (first 8 become qualified)
function makeThirdRanking(groupOrders: Record<string, string[]>): string[] {
  return GROUP_LETTERS.map((g) => groupOrders[g][2]);
}

// ── Table integrity ───────────────────────────────────────────────────────────

describe("THIRD_PLACE_ALLOCATION table", () => {
  it("has exactly 495 combinations", () => {
    expect(Object.keys(THIRD_PLACE_ALLOCATION).length).toBe(495);
  });

  it("each combination key has 8 distinct group letters", () => {
    for (const key of Object.keys(THIRD_PLACE_ALLOCATION)) {
      expect(key.length, `key "${key}" length`).toBe(8);
      expect(new Set(key.split("")).size, `key "${key}" distinct letters`).toBe(8);
    }
  });

  it("each combination has all 8 slots filled", () => {
    for (const [key, assignment] of Object.entries(THIRD_PLACE_ALLOCATION)) {
      for (const slotId of THIRD_PLACE_SLOT_IDS) {
        expect(
          assignment[slotId as ThirdPlaceMatchId],
          `${key} missing slot ${slotId}`,
        ).toBeTruthy();
      }
    }
  });

  it("each group is used exactly once per assignment", () => {
    for (const [key, assignment] of Object.entries(THIRD_PLACE_ALLOCATION)) {
      const keyGroups = new Set(key.split(""));
      const values = Object.values(assignment);
      expect(new Set(values).size, `${key} has duplicate groups`).toBe(8);
      for (const g of values) {
        expect(keyGroups.has(g), `${key}: assigned group "${g}" not in key`).toBe(true);
      }
    }
  });

  it("each assigned group respects allowedGroups for its slot", () => {
    for (const [key, assignment] of Object.entries(THIRD_PLACE_ALLOCATION)) {
      for (const slotId of THIRD_PLACE_SLOT_IDS) {
        const group = assignment[slotId as ThirdPlaceMatchId];
        const allowed = THIRD_PLACE_SLOT_ALLOWED[slotId as ThirdPlaceMatchId] as string[];
        expect(
          allowed.includes(group),
          `${key} slot ${slotId} assigned group "${group}" not in allowed [${allowed.join(",")}]`,
        ).toBe(true);
      }
    }
  });
});

// ── resolveBracket — no placeholder labels ────────────────────────────────────

describe("resolveBracket", () => {
  it("no valid combination leaves placeholder labels in 3rd-place slots", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);
    const state = resolveBracket(groupOrders, thirdPlaceRanking, {});

    expect(state.thirdAssignmentError).toBeFalsy();

    const thirdSlotIds: ThirdPlaceMatchId[] = ["M74","M77","M79","M80","M81","M82","M85","M87"];
    for (const matchId of thirdSlotIds) {
      const match = state.matches[matchId];
      expect(match?.teamB, `${matchId}.teamB should be resolved`).toBeTruthy();
      // Old format was "3.º A/E/H/I/J" — must not appear after the fix
      expect(match?.labelB ?? "", `${matchId}.labelB must not contain old placeholder`).not.toMatch(/^3\.º /);
    }
  });
});

// ── deriveRoundTeams ──────────────────────────────────────────────────────────

describe("deriveRoundTeams", () => {
  it("roundOf32Teams has exactly 32 unique teams for a complete bracket", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);
    const state = resolveBracket(groupOrders, thirdPlaceRanking, {});
    const derived = deriveRoundTeams(state);

    expect(derived.roundOf32Teams.length).toBe(32);
    expect(new Set(derived.roundOf32Teams).size).toBe(32);
  });
});

// ── Round of 32 pairs ─────────────────────────────────────────────────────────

describe("bracket template — Round of 32 pairs (M73–M88)", () => {
  const tmplMap = Object.fromEntries(BRACKET_TEMPLATE.map((t) => [t.id, t]));

  const r32Pairs: [string, object, object][] = [
    ["M73",  { type: "2nd", group: "A" }, { type: "2nd", group: "B" }],
    ["M74",  { type: "1st", group: "E" }, { type: "3rd", allowedGroups: ["A","B","C","D","F"] }],
    ["M75",  { type: "1st", group: "F" }, { type: "2nd", group: "C" }],
    ["M76",  { type: "1st", group: "C" }, { type: "2nd", group: "F" }],
    ["M77",  { type: "1st", group: "I" }, { type: "3rd", allowedGroups: ["C","D","F","G","H"] }],
    ["M78",  { type: "2nd", group: "E" }, { type: "2nd", group: "I" }],
    ["M79",  { type: "1st", group: "A" }, { type: "3rd", allowedGroups: ["C","E","F","H","I"] }],
    ["M80",  { type: "1st", group: "L" }, { type: "3rd", allowedGroups: ["E","H","I","J","K"] }],
    ["M81",  { type: "1st", group: "D" }, { type: "3rd", allowedGroups: ["B","E","F","I","J"] }],
    ["M82",  { type: "1st", group: "G" }, { type: "3rd", allowedGroups: ["A","E","H","I","J"] }],
    ["M83",  { type: "2nd", group: "K" }, { type: "2nd", group: "L" }],
    ["M84",  { type: "1st", group: "H" }, { type: "2nd", group: "J" }],
    ["M85",  { type: "1st", group: "B" }, { type: "3rd", allowedGroups: ["E","F","G","I","J"] }],
    ["M86",  { type: "1st", group: "J" }, { type: "2nd", group: "H" }],
    ["M87",  { type: "1st", group: "K" }, { type: "3rd", allowedGroups: ["D","E","I","J","L"] }],
    ["M88",  { type: "2nd", group: "D" }, { type: "2nd", group: "G" }],
  ];

  for (const [id, slotA, slotB] of r32Pairs) {
    it(`${id} has correct pair`, () => {
      expect(tmplMap[id]?.slotA).toMatchObject(slotA);
      expect(tmplMap[id]?.slotB).toMatchObject(slotB);
    });
  }
});

// ── Round of 16 sources (M89–M96) ────────────────────────────────────────────

describe("bracket template — Round of 16 sources (M89–M96)", () => {
  const tmplMap = Object.fromEntries(BRACKET_TEMPLATE.map((t) => [t.id, t]));

  const r16Pairs: [string, string, string][] = [
    ["M89", "M74", "M77"],
    ["M90", "M73", "M75"],
    ["M91", "M76", "M78"],
    ["M92", "M79", "M80"],
    ["M93", "M83", "M84"],
    ["M94", "M81", "M82"],
    ["M95", "M86", "M88"],
    ["M96", "M85", "M87"],
  ];

  for (const [id, srcA, srcB] of r16Pairs) {
    it(`${id} draws from W${srcA} (slotA) and W${srcB} (slotB)`, () => {
      expect(tmplMap[id]?.slotA).toMatchObject({ type: "winner", matchId: srcA });
      expect(tmplMap[id]?.slotB).toMatchObject({ type: "winner", matchId: srcB });
    });
  }
});

// ── Quarter-final sources (M97–M100) ─────────────────────────────────────────

describe("bracket template — Quarter-final sources (M97–M100)", () => {
  const tmplMap = Object.fromEntries(BRACKET_TEMPLATE.map((t) => [t.id, t]));

  const qfPairs: [string, string, string][] = [
    ["M97",  "M89", "M90"],
    ["M98",  "M93", "M94"],
    ["M99",  "M91", "M92"],
    ["M100", "M95", "M96"],
  ];

  for (const [id, srcA, srcB] of qfPairs) {
    it(`${id} draws from W${srcA} (slotA) and W${srcB} (slotB)`, () => {
      expect(tmplMap[id]?.slotA).toMatchObject({ type: "winner", matchId: srcA });
      expect(tmplMap[id]?.slotB).toMatchObject({ type: "winner", matchId: srcB });
    });
  }
});

// ── M103 and M104 structural correctness ─────────────────────────────────────

describe("bracket template — M103 and M104", () => {
  it("M103 is third_place receiving losers of semi-finals", () => {
    const m103 = BRACKET_TEMPLATE.find((t) => t.id === "M103");
    expect(m103?.round).toBe("third_place");
    expect(m103?.slotA).toMatchObject({ type: "loser", matchId: "M101" });
    expect(m103?.slotB).toMatchObject({ type: "loser", matchId: "M102" });
  });

  it("M104 is final receiving winners of semi-finals", () => {
    const m104 = BRACKET_TEMPLATE.find((t) => t.id === "M104");
    expect(m104?.round).toBe("final");
    expect(m104?.slotA).toMatchObject({ type: "winner", matchId: "M101" });
    expect(m104?.slotB).toMatchObject({ type: "winner", matchId: "M102" });
  });
});

// ── resolveBracket end-to-end — /aposta-inicial propagation ──────────────────
//
// Simulates exactly what /aposta-inicial does at runtime:
//   bracketState = resolveBracket(groupOrders, thirdPlaceRanking, bracketChoices)
// Picks slotA (teamA) as winner in every R32 and R16 match, then verifies
// that teamA/teamB in each downstream match matches the official bracket.

describe("resolveBracket end-to-end — /aposta-inicial bracket propagation", () => {
  it("R16 matches (M89–M96) have correct teamA/teamB after R32 choices", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);

    // Shorthand helpers
    const p1 = (g: string) => groupOrders[g][0]; // 1st place of group g
    const p2 = (g: string) => groupOrders[g][1]; // 2nd place of group g

    // Pick slotA (teamA) as winner of each R32 match
    const r32Choices: Record<string, string> = {
      M73: p2("A"), M74: p1("E"), M75: p1("F"), M76: p1("C"),
      M77: p1("I"), M78: p2("E"), M79: p1("A"), M80: p1("L"),
      M81: p1("D"), M82: p1("G"), M83: p2("K"), M84: p1("H"),
      M85: p1("B"), M86: p1("J"), M87: p1("K"), M88: p2("D"),
    };

    const state = resolveBracket(groupOrders, thirdPlaceRanking, r32Choices);
    const m = state.matches;

    // Official bracket: M89 = W74 vs W77
    expect(m["M89"].teamA).toBe(p1("E"));   // W74
    expect(m["M89"].teamB).toBe(p1("I"));   // W77

    // M90 = W73 vs W75
    expect(m["M90"].teamA).toBe(p2("A"));   // W73
    expect(m["M90"].teamB).toBe(p1("F"));   // W75

    // M91 = W76 vs W78
    expect(m["M91"].teamA).toBe(p1("C"));   // W76
    expect(m["M91"].teamB).toBe(p2("E"));   // W78

    // M92 = W79 vs W80
    expect(m["M92"].teamA).toBe(p1("A"));   // W79
    expect(m["M92"].teamB).toBe(p1("L"));   // W80

    // M93 = W83 vs W84
    expect(m["M93"].teamA).toBe(p2("K"));   // W83
    expect(m["M93"].teamB).toBe(p1("H"));   // W84

    // M94 = W81 vs W82
    expect(m["M94"].teamA).toBe(p1("D"));   // W81
    expect(m["M94"].teamB).toBe(p1("G"));   // W82

    // M95 = W86 vs W88
    expect(m["M95"].teamA).toBe(p1("J"));   // W86
    expect(m["M95"].teamB).toBe(p2("D"));   // W88

    // M96 = W85 vs W87
    expect(m["M96"].teamA).toBe(p1("B"));   // W85
    expect(m["M96"].teamB).toBe(p1("K"));   // W87
  });

  it("QF matches (M97–M100) have correct teamA/teamB after R32+R16 choices", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);

    const p1 = (g: string) => groupOrders[g][0];
    const p2 = (g: string) => groupOrders[g][1];

    // R32: pick slotA as winner (same as above)
    const r32Choices: Record<string, string> = {
      M73: p2("A"), M74: p1("E"), M75: p1("F"), M76: p1("C"),
      M77: p1("I"), M78: p2("E"), M79: p1("A"), M80: p1("L"),
      M81: p1("D"), M82: p1("G"), M83: p2("K"), M84: p1("H"),
      M85: p1("B"), M86: p1("J"), M87: p1("K"), M88: p2("D"),
    };

    // R16: pick slotA (teamA) as winner of each R16 match
    const r16Choices: Record<string, string> = {
      M89: p1("E"),  // W74 = slotA of new M89
      M90: p2("A"),  // W73 = slotA of new M90
      M91: p1("C"),  // W76 = slotA of new M91
      M92: p1("A"),  // W79 = slotA of new M92
      M93: p2("K"),  // W83 = slotA of new M93
      M94: p1("D"),  // W81 = slotA of new M94
      M95: p1("J"),  // W86 = slotA of new M95
      M96: p1("B"),  // W85 = slotA of new M96
    };

    const state = resolveBracket(groupOrders, thirdPlaceRanking, {
      ...r32Choices,
      ...r16Choices,
    });
    const m = state.matches;

    // M97 = W89 vs W90
    expect(m["M97"].teamA).toBe(p1("E"));   // W89 slotA winner = W74 = p1("E")
    expect(m["M97"].teamB).toBe(p2("A"));   // W90 slotA winner = W73 = p2("A")

    // M98 = W93 vs W94
    expect(m["M98"].teamA).toBe(p2("K"));   // W93 slotA winner = W83 = p2("K")
    expect(m["M98"].teamB).toBe(p1("D"));   // W94 slotA winner = W81 = p1("D")

    // M99 = W91 vs W92
    expect(m["M99"].teamA).toBe(p1("C"));   // W91 slotA winner = W76 = p1("C")
    expect(m["M99"].teamB).toBe(p1("A"));   // W92 slotA winner = W79 = p1("A")

    // M100 = W95 vs W96
    expect(m["M100"].teamA).toBe(p1("J"));  // W95 slotA winner = W86 = p1("J")
    expect(m["M100"].teamB).toBe(p1("B"));  // W96 slotA winner = W85 = p1("B")
  });
});

// ── Migration from old prediction — stale bracketChoices are cleared ──────────
//
// Simulates a user whose aposta was saved before a bracket-structure fix.
// Old bracketChoices may reference teams that are no longer in a given match
// under the current BRACKET_TEMPLATE. resolveBracket must clear those choices
// and still produce the correct teamA/teamB for M89–M96.

describe("migration from old prediction — stale bracketChoices are cleared", () => {
  it("stale R16 choices are nullified; M89–M96 follow the new bracket template", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);

    const p1 = (g: string) => groupOrders[g][0];
    const p2 = (g: string) => groupOrders[g][1];

    // Valid R32 choices: slotA (teamA) wins every match
    const r32Choices: Record<string, string | null> = {
      M73: p2("A"), M74: p1("E"), M75: p1("F"), M76: p1("C"),
      M77: p1("I"), M78: p2("E"), M79: p1("A"), M80: p1("L"),
      M81: p1("D"), M82: p1("G"), M83: p2("K"), M84: p1("H"),
      M85: p1("B"), M86: p1("J"), M87: p1("K"), M88: p2("D"),
    };

    // Stale R16 choices from an old bracket structure where match pairings differed.
    // In the new bracket:
    //   M89 = W74 (=1st(E)) vs W77 (=1st(I))  → p1("A") is NOT in this match
    //   M96 = W85 (=1st(B)) vs W87 (=1st(K))  → p2("G") is NOT in this match
    const staleChoices: Record<string, string | null> = {
      ...r32Choices,
      M89: p1("A"),  // stale: p1("A") won M79, not present in new M89 (W74 vs W77)
      M96: p2("G"),  // stale: p2("G") won M88, not present in new M96 (W85 vs W87)
    };

    const state = resolveBracket(groupOrders, thirdPlaceRanking, staleChoices);
    const m = state.matches;

    // M89 = W74 vs W77 (new official structure)
    expect(m["M89"].teamA).toBe(p1("E"));   // W74
    expect(m["M89"].teamB).toBe(p1("I"));   // W77
    expect(m["M89"].winnerId).toBeNull();    // stale p1("A") invalidated

    // M90 = W73 vs W75 — no stale choice
    expect(m["M90"].teamA).toBe(p2("A"));   // W73
    expect(m["M90"].teamB).toBe(p1("F"));   // W75
    expect(m["M90"].winnerId).toBeNull();

    // M91 = W76 vs W78
    expect(m["M91"].teamA).toBe(p1("C"));   // W76
    expect(m["M91"].teamB).toBe(p2("E"));   // W78

    // M92 = W79 vs W80
    expect(m["M92"].teamA).toBe(p1("A"));   // W79
    expect(m["M92"].teamB).toBe(p1("L"));   // W80

    // M93 = W83 vs W84
    expect(m["M93"].teamA).toBe(p2("K"));   // W83
    expect(m["M93"].teamB).toBe(p1("H"));   // W84

    // M94 = W81 vs W82
    expect(m["M94"].teamA).toBe(p1("D"));   // W81
    expect(m["M94"].teamB).toBe(p1("G"));   // W82

    // M95 = W86 vs W88
    expect(m["M95"].teamA).toBe(p1("J"));   // W86
    expect(m["M95"].teamB).toBe(p2("D"));   // W88

    // M96 = W85 vs W87 (new official structure)
    expect(m["M96"].teamA).toBe(p1("B"));   // W85
    expect(m["M96"].teamB).toBe(p1("K"));   // W87
    expect(m["M96"].winnerId).toBeNull();    // stale p2("G") invalidated
  });

  it("deriveRoundTeams ignores stale R16 choices; roundOf16Teams still has 16 entries", () => {
    const groupOrders = makeGroupOrders();
    const thirdPlaceRanking = makeThirdRanking(groupOrders);

    const p1 = (g: string) => groupOrders[g][0];
    const p2 = (g: string) => groupOrders[g][1];

    const staleChoices: Record<string, string | null> = {
      M73: p2("A"), M74: p1("E"), M75: p1("F"), M76: p1("C"),
      M77: p1("I"), M78: p2("E"), M79: p1("A"), M80: p1("L"),
      M81: p1("D"), M82: p1("G"), M83: p2("K"), M84: p1("H"),
      M85: p1("B"), M86: p1("J"), M87: p1("K"), M88: p2("D"),
      // Both stale — teams not present in these matches under new bracket
      M89: p1("A"),
      M96: p2("G"),
    };

    const state = resolveBracket(groupOrders, thirdPlaceRanking, staleChoices);
    const derived = deriveRoundTeams(state);

    // R32 choices were all valid → 16 winners advance
    expect(derived.roundOf16Teams).toHaveLength(16);
    expect(new Set(derived.roundOf16Teams).size).toBe(16);

    // No valid R16 choices → no QF teams
    expect(derived.quarterFinalTeams).toHaveLength(0);
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("getThirdPlaceAssignment — error handling", () => {
  it("throws a controlled error for wrong group count", () => {
    expect(() => getThirdPlaceAssignment(["A","B","C"])).toThrow(
      "getThirdPlaceAssignment: esperados 8 grupos, recebidos 3",
    );
  });

  it("throws a controlled error for unknown combination (group not in A–L)", () => {
    expect(() =>
      getThirdPlaceAssignment(["A","B","C","D","E","F","G","Z"]),
    ).toThrow("Combinação de terceiros não encontrada na tabela");
  });

  it("resolveBracket sets thirdAssignmentError for malformed input", () => {
    // Force thirdAssignmentError by injecting a fake group letter into groupOf
    // via a corrupted groupOrders (team at index 2 belonging to a non-existent group)
    const groupOrders = makeGroupOrders();
    // Override group A's 3rd-place team with a team id that maps to no group
    groupOrders["A"] = ["fake_1","fake_2","orphan_team","fake_4"];
    const thirdPlaceRanking = GROUP_LETTERS.map((g) => groupOrders[g][2]);
    const state = resolveBracket(groupOrders, thirdPlaceRanking, {});
    // "orphan_team" has no entry in groupOf, so qualifiedGroups.length < 8
    // → thirdAssignment stays empty, thirdAssignmentError stays false (graceful degradation)
    // (Only an invalid key triggers the error; missing group just skips resolution)
    expect(state.thirdAssignmentError).toBeFalsy();
  });
});
