import type { ScoringSettings } from "@/types";

export const defaultScoring: ScoringSettings = {
  initial: {
    winner: 80,
    runnerUp: 60,
    thirdPlace: 30,
    fourthPlace: 20,
    topScorer: 40,
    bestPlayer: 40,
    bestYoungPlayer: 30,
    bestGoalkeeper: 25,
    finalTeam: 40,
    semiFinalTeam: 25,
    quarterFinalTeam: 15,
    roundOf16Team: 10,
    roundOf32Team: 5,
    groupPosition: 5,
  },
  knockout: {
    round_of_32: { oddsMultiplier: 2, qualifiedTeamPoints: 1, scoreExactPoints: 0 },
    round_of_16: { oddsMultiplier: 2, qualifiedTeamPoints: 1, scoreExactPoints: 0 },
    quarter_final: { oddsMultiplier: 3, qualifiedTeamPoints: 2, scoreExactPoints: 10 },
    semi_final: { oddsMultiplier: 5, qualifiedTeamPoints: 5, scoreExactPoints: 15 },
    final: { oddsMultiplier: 5, qualifiedTeamPoints: 5, scoreExactPoints: 25 },
  },
};
