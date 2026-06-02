import { describe, expect, it } from "vitest";
import {
  validateKnockoutPrediction,
  requiresFinalScore,
  isBettingOpen,
} from "@/lib/matchPredictionValidation";

const A = "team_a";
const B = "team_b";

describe("requiresFinalScore", () => {
  it("returns false for round_of_32 and round_of_16", () => {
    expect(requiresFinalScore("round_of_32")).toBe(false);
    expect(requiresFinalScore("round_of_16")).toBe(false);
  });

  it("returns true for quarter_final, semi_final, third_place, final", () => {
    expect(requiresFinalScore("quarter_final")).toBe(true);
    expect(requiresFinalScore("semi_final")).toBe(true);
    expect(requiresFinalScore("third_place")).toBe(true);
    expect(requiresFinalScore("final")).toBe(true);
  });
});

describe("validateKnockoutPrediction – round_of_32 (no final score)", () => {
  it("accepts teamA win with teamA qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "teamA", qualifierTeamId: A }, A, B, "round_of_32")).toBeNull();
  });

  it("accepts teamB win with teamB qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "teamB", qualifierTeamId: B }, A, B, "round_of_32")).toBeNull();
  });

  it("accepts draw with teamA qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "draw", qualifierTeamId: A }, A, B, "round_of_32")).toBeNull();
  });

  it("accepts draw with teamB qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "draw", qualifierTeamId: B }, A, B, "round_of_32")).toBeNull();
  });

  it("rejects teamA win with teamB qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "teamA", qualifierTeamId: B }, A, B, "round_of_32")).not.toBeNull();
  });

  it("rejects teamB win with teamA qualifying", () => {
    expect(validateKnockoutPrediction({ result90: "teamB", qualifierTeamId: A }, A, B, "round_of_32")).not.toBeNull();
  });

  it("rejects unknown qualifier team", () => {
    expect(validateKnockoutPrediction({ result90: "draw", qualifierTeamId: "other" }, A, B, "round_of_32")).not.toBeNull();
  });
});

describe("validateKnockoutPrediction – quarter_final (final score required)", () => {
  it("rejects missing final score", () => {
    expect(validateKnockoutPrediction({ result90: "teamA", qualifierTeamId: A }, A, B, "quarter_final")).not.toBeNull();
  });

  it("accepts A win at 90min + A wins final + A qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamA", qualifierTeamId: A, scoreFinalTeamA: 2, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("accepts B win at 90min + B wins final + B qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamB", qualifierTeamId: B, scoreFinalTeamA: 0, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("accepts draw + A wins in ET + A qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: 2, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("accepts draw + B wins in ET + B qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: B, scoreFinalTeamA: 1, scoreFinalTeamB: 2 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("accepts draw + tied final (penalties) + A qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: 1, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("accepts draw + tied final (penalties) + B qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: B, scoreFinalTeamA: 1, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).toBeNull();
  });

  it("rejects draw + A wins ET + B qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: B, scoreFinalTeamA: 2, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects draw + B wins ET + A qualifies", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: 1, scoreFinalTeamB: 2 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects A win at 90min + tied final (inconsistent – no ET if A won)", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamA", qualifierTeamId: A, scoreFinalTeamA: 1, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects A win at 90min + B wins final", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamA", qualifierTeamId: B, scoreFinalTeamA: 1, scoreFinalTeamB: 2 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects B win at 90min + A wins final", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamB", qualifierTeamId: A, scoreFinalTeamA: 2, scoreFinalTeamB: 1 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects negative scores", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: -1, scoreFinalTeamB: 0 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });

  it("rejects non-integer scores", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: 1.5, scoreFinalTeamB: 0 },
      A, B, "quarter_final"
    )).not.toBeNull();
  });
});

describe("validateKnockoutPrediction – semi_final and final", () => {
  it("works for semi_final", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: A, scoreFinalTeamA: 2, scoreFinalTeamB: 1 },
      A, B, "semi_final"
    )).toBeNull();
  });

  it("works for final", () => {
    expect(validateKnockoutPrediction(
      { result90: "teamB", qualifierTeamId: B, scoreFinalTeamA: 0, scoreFinalTeamB: 2 },
      A, B, "final"
    )).toBeNull();
  });

  it("works for third_place", () => {
    expect(validateKnockoutPrediction(
      { result90: "draw", qualifierTeamId: B, scoreFinalTeamA: 1, scoreFinalTeamB: 1 },
      A, B, "third_place"
    )).toBeNull();
  });
});

describe("isBettingOpen", () => {
  it("returns false when bettingOpen=false", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isBettingOpen({ bettingOpen: false, startsAt: future })).toBe(false);
  });

  it("returns false when past deadline (startsAt - 15min in the past)", () => {
    const recent = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    expect(isBettingOpen({ bettingOpen: true, startsAt: recent })).toBe(false);
  });

  it("returns true when bettingOpen=true and deadline not passed", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isBettingOpen({ bettingOpen: true, startsAt: future })).toBe(true);
  });
});
