import { describe, expect, it } from "vitest";
import { defaultScoring } from "@/data/defaultScoring";
import { calculateInitialPredictionPoints, calculateMatchPredictionPoints } from "@/lib/scoring";
import type { InitialActuals, InitialPrediction, Match, MatchPrediction } from "@/types";

const prediction: InitialPrediction = {
  userId: "u1",
  groupPositions: { A: ["portugal", "brazil", "france", "spain"] },
  roundOf32Teams: ["portugal", "brazil"],
  roundOf16Teams: ["portugal"],
  quarterFinalTeams: ["portugal"],
  semiFinalTeams: ["portugal"],
  finalTeams: ["portugal", "argentina"],
  winner: "portugal",
  runnerUp: "argentina",
  topScorer: "Player A",
  bestPlayer: "Player B",
  bestYoungPlayer: "Player C",
  bestGoalkeeper: "Player D",
  locked: true,
};

const actuals: InitialActuals = {
  groupPositions: { A: ["portugal", "brazil", "spain", "france"] },
  roundOf32Teams: ["portugal", "brazil"],
  roundOf16Teams: ["portugal"],
  quarterFinalTeams: ["portugal"],
  semiFinalTeams: ["portugal"],
  finalTeams: ["portugal", "argentina"],
  winner: "portugal",
  runnerUp: "argentina",
  topScorer: "Player A",
  bestPlayer: "Player B",
  bestYoungPlayer: "Player C",
  bestGoalkeeper: "Player D",
};

describe("scoring", () => {
  it("scores initial prediction", () => {
    const result = calculateInitialPredictionPoints(prediction, actuals, defaultScoring.initial);
    expect(result.breakdown.winner).toBe(80);
    expect(result.breakdown.finalTeams).toBe(80);
    expect(result.breakdown.groupPositions).toBe(10);
    expect(result.points).toBeGreaterThan(0);
  });

  it("scores thirdPlace and fourthPlace correctly", () => {
    const pred: InitialPrediction = { ...prediction, thirdPlace: "france", fourthPlace: "spain" };
    const acts: InitialActuals = { ...actuals, thirdPlace: "france", fourthPlace: "spain" };
    const result = calculateInitialPredictionPoints(pred, acts, defaultScoring.initial);
    expect(result.breakdown.thirdPlace).toBe(30);
    expect(result.breakdown.fourthPlace).toBe(20);
  });

  it("gives zero for wrong thirdPlace and fourthPlace", () => {
    const pred: InitialPrediction = { ...prediction, thirdPlace: "france", fourthPlace: "spain" };
    const acts: InitialActuals = { ...actuals, thirdPlace: "germany", fourthPlace: "brazil" };
    const result = calculateInitialPredictionPoints(pred, acts, defaultScoring.initial);
    expect(result.breakdown.thirdPlace).toBe(0);
    expect(result.breakdown.fourthPlace).toBe(0);
  });

  it("scores zero for all fields when actuals are empty", () => {
    const emptyActuals: InitialActuals = {
      groupPositions: {},
      roundOf32Teams: [],
      roundOf16Teams: [],
      quarterFinalTeams: [],
      semiFinalTeams: [],
      finalTeams: [],
      winner: "",
      runnerUp: "",
      thirdPlace: "",
      fourthPlace: "",
      topScorer: "",
      bestPlayer: "",
      bestYoungPlayer: "",
      bestGoalkeeper: "",
    };
    const result = calculateInitialPredictionPoints(prediction, emptyActuals, defaultScoring.initial);
    expect(result.points).toBe(0);
  });

  it("scores partial actuals without crashing", () => {
    const partialActuals: InitialActuals = {
      ...actuals,
      roundOf32Teams: [],
      roundOf16Teams: [],
      quarterFinalTeams: [],
      semiFinalTeams: [],
      finalTeams: [],
      winner: "",
      runnerUp: "",
    };
    const result = calculateInitialPredictionPoints(prediction, partialActuals, defaultScoring.initial);
    // only groupPositions should score
    expect(result.breakdown.winner).toBe(0);
    expect(result.breakdown.finalTeams).toBe(0);
    expect(result.breakdown.groupPositions).toBeGreaterThan(0);
    expect(result.points).toBeGreaterThan(0);
  });

  it("scores a quarter-final match", () => {
    const match: Match = {
      id: "qf_1",
      round: "quarter_final",
      homeTeam: "france",
      awayTeam: "argentina",
      status: "finished",
      odds: { home: 2.1, draw: 3.4, away: 2.9 },
      result90: { homeGoals: 2, awayGoals: 2 },
      result120: { homeGoals: 3, awayGoals: 2 },
      qualifiedTeam: "france",
    };
    const bet: MatchPrediction = {
      userId: "u1",
      matchId: "qf_1",
      prediction90: "draw",
      qualifiedTeam: "france",
      score120: { homeGoals: 3, awayGoals: 2 },
      locked: true,
    };
    const result = calculateMatchPredictionPoints(bet, match, defaultScoring.knockout);
    expect(result.breakdown.oddsPoints).toBe(10.2);
    expect(result.breakdown.qualifiedTeamPoints).toBe(2);
    expect(result.breakdown.scoreExactPoints).toBe(10);
    expect(result.points).toBe(22.2);
  });

  it("returns zero when everything is wrong", () => {
    const match: Match = {
      id: "r16_1",
      round: "round_of_16",
      homeTeam: "a",
      awayTeam: "b",
      status: "finished",
      odds: { home: 1.5, draw: 4, away: 6 },
      result90: { homeGoals: 1, awayGoals: 0 },
      qualifiedTeam: "a",
    };
    const bet: MatchPrediction = {
      userId: "u1",
      matchId: "r16_1",
      prediction90: "away",
      qualifiedTeam: "b",
      locked: true,
    };
    const result = calculateMatchPredictionPoints(bet, match, defaultScoring.knockout);
    expect(result.points).toBe(0);
  });
});
