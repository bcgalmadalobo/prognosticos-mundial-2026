import type { KnockoutRound, KnockoutResult90 } from "@/types";

export const ROUNDS_WITH_FINAL_SCORE: KnockoutRound[] = [
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

export function requiresFinalScore(round: KnockoutRound): boolean {
  return ROUNDS_WITH_FINAL_SCORE.includes(round);
}

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  round_of_32: "16-avos",
  round_of_16: "Oitavos",
  quarter_final: "Quartos",
  semi_final: "Meias",
  third_place: "3.º/4.º Lugar",
  final: "Final",
};

export interface PredictionInput {
  result90: KnockoutResult90;
  qualifierTeamId: string;
  scoreFinalTeamA?: number;
  scoreFinalTeamB?: number;
}

/**
 * Pure validation for a knockout match prediction.
 * Returns an error string, or null if the prediction is coherent.
 *
 * Rules:
 * - qualifierTeamId must be one of the two teams.
 * - If result90 is a non-draw win, that team must qualify.
 * - For QF/SF/3PL/Final: scoreFinal fields are required.
 *   - If A won at 90min → scoreFinalTeamA must be > scoreFinalTeamB (no ET).
 *   - If B won at 90min → scoreFinalTeamB must be > scoreFinalTeamA.
 *   - scoreFinal outcome must match qualifier (ET winner or penalties).
 */
export function validateKnockoutPrediction(
  input: PredictionInput,
  matchTeamAId: string,
  matchTeamBId: string,
  round: KnockoutRound
): string | null {
  const { result90, qualifierTeamId, scoreFinalTeamA, scoreFinalTeamB } = input;

  if (qualifierTeamId !== matchTeamAId && qualifierTeamId !== matchTeamBId) {
    return "A equipa que passa deve ser uma das duas equipas do jogo.";
  }

  if (result90 === "teamA" && qualifierTeamId !== matchTeamAId) {
    return "Se equipa A ganhou aos 90 minutos, a equipa A tem de passar.";
  }
  if (result90 === "teamB" && qualifierTeamId !== matchTeamBId) {
    return "Se equipa B ganhou aos 90 minutos, a equipa B tem de passar.";
  }

  if (!requiresFinalScore(round)) return null;

  if (scoreFinalTeamA === undefined || scoreFinalTeamB === undefined) {
    return "Nesta ronda é obrigatório apostares no resultado final (após 120 min se necessário).";
  }
  if (!Number.isInteger(scoreFinalTeamA) || scoreFinalTeamA < 0) {
    return "Resultado final inválido para equipa A.";
  }
  if (!Number.isInteger(scoreFinalTeamB) || scoreFinalTeamB < 0) {
    return "Resultado final inválido para equipa B.";
  }

  // If a team won at 90min there is no ET, so the final score must reflect that win
  if (result90 === "teamA" && scoreFinalTeamA <= scoreFinalTeamB) {
    return "Se equipa A ganhou aos 90 minutos, o resultado final deve mostrar vitória de A.";
  }
  if (result90 === "teamB" && scoreFinalTeamB <= scoreFinalTeamA) {
    return "Se equipa B ganhou aos 90 minutos, o resultado final deve mostrar vitória de B.";
  }

  // scoreFinal outcome must match qualifier
  if (scoreFinalTeamA > scoreFinalTeamB && qualifierTeamId !== matchTeamAId) {
    return "Se equipa A ganhou no resultado final, deve ser a equipa que passa.";
  }
  if (scoreFinalTeamB > scoreFinalTeamA && qualifierTeamId !== matchTeamBId) {
    return "Se equipa B ganhou no resultado final, deve ser a equipa que passa.";
  }
  // Equal scores → penalties → either team can qualify; no additional check needed

  return null;
}

export function bettingDeadline(startsAt: string): Date {
  return new Date(new Date(startsAt).getTime() - 15 * 60 * 1000);
}

export function notificationTime(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() - 30 * 60 * 1000).toISOString();
}

export function isBettingOpen(match: { bettingOpen: boolean; startsAt: string }): boolean {
  return match.bettingOpen && Date.now() < bettingDeadline(match.startsAt).getTime();
}
