import { describe, expect, it } from "vitest";
import { defaultScoring } from "@/data/defaultScoring";
import { calculateKnockoutMatchPredictionPoints } from "@/lib/scoring";
import type { KnockoutMatch, KnockoutMatchPrediction, KnockoutResult90, KnockoutRound } from "@/types";

const baseMatch: KnockoutMatch = {
  id: "M97",
  matchNumber: 97,
  round: "quarter_final",
  slotA: "W89",
  slotB: "W90",
  teamA: "portugal",
  teamB: "france",
  startsAt: "2026-07-03T21:00:00Z",
  displayTimePortugal: "03/07/2026 22:00",
  timezoneNote: "UTC",
  sourceNote: "test",
  venue: "MetLife Stadium",
  city: "East Rutherford",
  country: "USA",
  bettingOpen: false,
  status: "finished",
  timeTBD: false,
  oddsTeamA: 2.1,
  oddsDraw: 3.4,
  oddsTeamB: 2.9,
  result90: "teamA",
  resultFinal: { scoreTeamA: 3, scoreTeamB: 2 },
  winnerTeamId: "portugal",
};

const basePrediction: KnockoutMatchPrediction = {
  uid: "u1",
  matchId: "M97",
  round: "quarter_final",
  result90: "teamA",
  qualifierTeamId: "portugal",
  scoreFinalTeamA: 3,
  scoreFinalTeamB: 2,
};

describe("calculateKnockoutMatchPredictionPoints", () => {
  it("scores oddsPoints when result90 matches teamA", () => {
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(6.3); // 2.1 * 3
  });

  it("scores oddsPoints when result90 matches draw", () => {
    const match: KnockoutMatch = { ...baseMatch, result90: "draw", winnerTeamId: "portugal" };
    const pred: KnockoutMatchPrediction = {
      ...basePrediction,
      result90: "draw",
      scoreFinalTeamA: 3,
      scoreFinalTeamB: 2,
    };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(10.2); // 3.4 * 3
  });

  it("scores oddsPoints when result90 matches teamB", () => {
    const match: KnockoutMatch = { ...baseMatch, result90: "teamB", winnerTeamId: "france" };
    const pred: KnockoutMatchPrediction = {
      ...basePrediction,
      result90: "teamB",
      qualifierTeamId: "france",
      scoreFinalTeamA: 2,
      scoreFinalTeamB: 3,
    };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(8.7); // 2.9 * 3
  });

  it("gives zero oddsPoints when result90 doesn't match", () => {
    const pred: KnockoutMatchPrediction = { ...basePrediction, result90: "teamB" as KnockoutResult90 };
    const result = calculateKnockoutMatchPredictionPoints(pred, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(0);
  });

  it("gives zero oddsPoints when odd is missing", () => {
    const match: KnockoutMatch = { ...baseMatch, oddsTeamA: undefined };
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(0);
  });

  it("gives zero oddsPoints when match has no result90 yet", () => {
    const match: KnockoutMatch = { ...baseMatch, result90: undefined };
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(0);
  });

  it("scores qualifiedTeamPoints when winnerTeamId matches", () => {
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.qualifiedTeamPoints).toBe(2); // quarter_final default
  });

  it("gives zero qualifiedTeamPoints when qualifier is wrong team", () => {
    const pred: KnockoutMatchPrediction = { ...basePrediction, qualifierTeamId: "france" };
    const result = calculateKnockoutMatchPredictionPoints(pred, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.qualifiedTeamPoints).toBe(0);
  });

  it("gives zero qualifiedTeamPoints when match has no winnerTeamId", () => {
    const match: KnockoutMatch = { ...baseMatch, winnerTeamId: undefined };
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, match, defaultScoring.knockout);
    expect(result.breakdown.qualifiedTeamPoints).toBe(0);
  });

  it("scores scoreExactPoints when final score matches in QF", () => {
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.scoreExactPoints).toBe(10);
  });

  it("gives zero scoreExactPoints when final score is wrong", () => {
    const pred: KnockoutMatchPrediction = { ...basePrediction, scoreFinalTeamA: 1 };
    const result = calculateKnockoutMatchPredictionPoints(pred, baseMatch, defaultScoring.knockout);
    expect(result.breakdown.scoreExactPoints).toBe(0);
  });

  it("gives zero scoreExactPoints for round_of_32 (scoreExactPoints = 0 in settings)", () => {
    const match: KnockoutMatch = { ...baseMatch, round: "round_of_32" as KnockoutRound, resultFinal: { scoreTeamA: 3, scoreTeamB: 2 } };
    const pred: KnockoutMatchPrediction = { ...basePrediction, round: "round_of_32" as KnockoutRound };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.scoreExactPoints).toBe(0);
  });

  it("gives zero scoreExactPoints for round_of_16 (scoreExactPoints = 0 in settings)", () => {
    const match: KnockoutMatch = { ...baseMatch, round: "round_of_16" as KnockoutRound };
    const pred: KnockoutMatchPrediction = { ...basePrediction, round: "round_of_16" as KnockoutRound };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.scoreExactPoints).toBe(0);
  });

  it("gives zero scoreExactPoints when resultFinal is missing", () => {
    const match: KnockoutMatch = { ...baseMatch, resultFinal: undefined };
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, match, defaultScoring.knockout);
    expect(result.breakdown.scoreExactPoints).toBe(0);
  });

  it("scores third_place round with correct multipliers", () => {
    const match: KnockoutMatch = {
      ...baseMatch,
      id: "M103",
      matchNumber: 103,
      round: "third_place",
      oddsTeamA: 2.0,
      result90: "teamA",
      resultFinal: { scoreTeamA: 2, scoreTeamB: 1 },
      winnerTeamId: "portugal",
    };
    const pred: KnockoutMatchPrediction = {
      ...basePrediction,
      matchId: "M103",
      round: "third_place",
      result90: "teamA",
      qualifierTeamId: "portugal",
      scoreFinalTeamA: 2,
      scoreFinalTeamB: 1,
    };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(6.0);       // 2.0 * 3 (third_place oddsMultiplier)
    expect(result.breakdown.qualifiedTeamPoints).toBe(3); // third_place qualifiedTeamPoints
    expect(result.breakdown.scoreExactPoints).toBe(10);   // third_place scoreExactPoints
    expect(result.points).toBe(19.0);
  });

  it("scores semi_final with correct multipliers", () => {
    const match: KnockoutMatch = {
      ...baseMatch,
      round: "semi_final",
      oddsTeamA: 3.0,
      resultFinal: { scoreTeamA: 1, scoreTeamB: 0 },
    };
    const pred: KnockoutMatchPrediction = {
      ...basePrediction,
      round: "semi_final",
      scoreFinalTeamA: 1,
      scoreFinalTeamB: 0,
    };
    const result = calculateKnockoutMatchPredictionPoints(pred, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(15.0);       // 3.0 * 5 (semi_final oddsMultiplier)
    expect(result.breakdown.qualifiedTeamPoints).toBe(5); // semi_final qualifiedTeamPoints
    expect(result.breakdown.scoreExactPoints).toBe(15);   // semi_final scoreExactPoints
    expect(result.points).toBe(35.0);
  });

  it("returns zero when roundSettings are missing", () => {
    const settingsWithoutQF = {
      ...defaultScoring.knockout,
      quarter_final: undefined,
    } as unknown as typeof defaultScoring.knockout;
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, settingsWithoutQF);
    expect(result.points).toBe(0);
    expect(result.breakdown.oddsPoints).toBe(0);
  });

  it("is idempotent — same inputs produce same output", () => {
    const r1 = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    const r2 = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    expect(r1.points).toBe(r2.points);
    expect(r1.breakdown).toEqual(r2.breakdown);
  });

  it("sums all three components correctly", () => {
    const result = calculateKnockoutMatchPredictionPoints(basePrediction, baseMatch, defaultScoring.knockout);
    const expected = result.breakdown.oddsPoints + result.breakdown.qualifiedTeamPoints + result.breakdown.scoreExactPoints;
    expect(result.points).toBe(Number(expected.toFixed(1)));
  });
});
