import type {
  InitialActuals,
  InitialPrediction,
  Match,
  MatchPrediction,
  Outcome90,
  ScoringSettings,
  ScoreLine,
} from "@/types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function sameText(a?: string, b?: string) {
  return Boolean(a && b && normalize(a) === normalize(b));
}

function countIntersection(predicted: string[], actual: string[]) {
  const actualSet = new Set(actual.map(normalize));
  return predicted.filter((id) => actualSet.has(normalize(id))).length;
}

function countGroupPositions(predicted: Record<string, string[]>, actual: Record<string, string[]>) {
  let count = 0;
  for (const [groupId, predictedOrder] of Object.entries(predicted)) {
    const actualOrder = actual[groupId] ?? [];
    predictedOrder.forEach((teamId, index) => {
      if (sameText(teamId, actualOrder[index])) count += 1;
    });
  }
  return count;
}

export function calculateInitialPredictionPoints(
  prediction: InitialPrediction,
  actuals: InitialActuals,
  settings: ScoringSettings["initial"]
) {
  let points = 0;
  const breakdown: Record<string, number> = {};

  breakdown.winner = sameText(prediction.winner, actuals.winner) ? settings.winner : 0;
  breakdown.runnerUp = sameText(prediction.runnerUp, actuals.runnerUp) ? settings.runnerUp : 0;
  breakdown.thirdPlace = sameText(prediction.thirdPlace, actuals.thirdPlace) ? settings.thirdPlace : 0;
  breakdown.fourthPlace = sameText(prediction.fourthPlace, actuals.fourthPlace) ? settings.fourthPlace : 0;
  breakdown.topScorer = sameText(prediction.topScorer, actuals.topScorer) ? settings.topScorer : 0;
  breakdown.bestPlayer = sameText(prediction.bestPlayer, actuals.bestPlayer) ? settings.bestPlayer : 0;
  breakdown.bestYoungPlayer = sameText(prediction.bestYoungPlayer, actuals.bestYoungPlayer) ? settings.bestYoungPlayer : 0;
  breakdown.bestGoalkeeper = sameText(prediction.bestGoalkeeper, actuals.bestGoalkeeper) ? settings.bestGoalkeeper : 0;

  breakdown.finalTeams = countIntersection(prediction.finalTeams, actuals.finalTeams) * settings.finalTeam;
  breakdown.semiFinalTeams = countIntersection(prediction.semiFinalTeams, actuals.semiFinalTeams) * settings.semiFinalTeam;
  breakdown.quarterFinalTeams = countIntersection(prediction.quarterFinalTeams, actuals.quarterFinalTeams) * settings.quarterFinalTeam;
  breakdown.roundOf16Teams = countIntersection(prediction.roundOf16Teams, actuals.roundOf16Teams) * settings.roundOf16Team;
  breakdown.roundOf32Teams = countIntersection(prediction.roundOf32Teams, actuals.roundOf32Teams) * settings.roundOf32Team;
  breakdown.groupPositions = countGroupPositions(prediction.groupPositions, actuals.groupPositions) * settings.groupPosition;

  points = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { points, breakdown };
}

export function getOutcome90(result90?: ScoreLine): Outcome90 | null {
  if (!result90) return null;
  if (result90.homeGoals > result90.awayGoals) return "home";
  if (result90.homeGoals < result90.awayGoals) return "away";
  return "draw";
}

export function sameScore(a?: ScoreLine, b?: ScoreLine) {
  return Boolean(a && b && a.homeGoals === b.homeGoals && a.awayGoals === b.awayGoals);
}

export function calculateMatchPredictionPoints(
  prediction: MatchPrediction,
  match: Match,
  settings: ScoringSettings["knockout"]
) {
  const roundSettings = settings[match.round];
  const breakdown = { oddsPoints: 0, qualifiedTeamPoints: 0, scoreExactPoints: 0 };

  if (!roundSettings) return { points: 0, breakdown };

  const actualOutcome = getOutcome90(match.result90);
  if (actualOutcome && actualOutcome === prediction.prediction90 && match.odds) {
    breakdown.oddsPoints = Number((match.odds[prediction.prediction90] * roundSettings.oddsMultiplier).toFixed(1));
  }

  if (match.qualifiedTeam && sameText(prediction.qualifiedTeam, match.qualifiedTeam)) {
    breakdown.qualifiedTeamPoints = roundSettings.qualifiedTeamPoints;
  }

  if (roundSettings.scoreExactPoints > 0 && sameScore(prediction.score120, match.result120)) {
    breakdown.scoreExactPoints = roundSettings.scoreExactPoints;
  }

  const points = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { points, breakdown };
}
