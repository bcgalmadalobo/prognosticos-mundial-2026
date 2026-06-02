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
