"use client";

import { useMemo } from "react";
import { BRACKET_TEMPLATE } from "@/lib/bracket";
import { TEAMS } from "@/data/worldcup2026";
import type { BracketMatchState, BracketRound, BracketState } from "@/types";

const ROUND_ORDER: BracketRound[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

const ROUND_LABELS: Record<BracketRound, string> = {
  round_of_32:   "16-avos de Final",
  round_of_16:   "Oitavos de Final",
  quarter_final: "Quartos de Final",
  semi_final:    "Meias-Finais",
  third_place:   "Jogo do 3.º Lugar",
  final:         "Final",
};

const ROUND_GRID: Record<BracketRound, string> = {
  round_of_32:   "grid-cols-2 lg:grid-cols-4",
  round_of_16:   "grid-cols-2 lg:grid-cols-4",
  quarter_final: "grid-cols-2",
  semi_final:    "grid-cols-1 sm:grid-cols-2",
  third_place:   "grid-cols-1 sm:grid-cols-2",
  final:         "grid-cols-1 sm:grid-cols-2",
};

function TeamBtn({
  teamId,
  label,
  isWinner,
  disabled,
  onClick,
}: {
  teamId: string | null;
  label: string;
  isWinner: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const team = teamId ? TEAMS[teamId] : null;

  const cls = [
    "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
    disabled
      ? "cursor-not-allowed bg-slate-50 text-slate-400"
      : isWinner
        ? "bg-brand-600 text-white shadow-sm"
        : "cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200",
  ].join(" ");

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cls}>
      {team && <span className="shrink-0 leading-none">{team.flag}</span>}
      <span className="truncate">{label}</span>
      {isWinner && <span className="ml-auto shrink-0 text-[10px] font-bold">✓</span>}
    </button>
  );
}

function MatchCard({
  match,
  onChoice,
}: {
  match: BracketMatchState;
  onChoice: (matchId: string, winnerId: string) => void;
}) {
  const ready = !!match.teamA && !!match.teamB;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
        {match.id}
      </p>
      <div className="flex flex-col gap-1">
        <TeamBtn
          teamId={match.teamA}
          label={match.labelA}
          isWinner={match.winnerId !== null && match.winnerId === match.teamA}
          disabled={!ready}
          onClick={() => match.teamA && onChoice(match.id, match.teamA)}
        />
        <p className="text-center text-[10px] text-slate-400">vs</p>
        <TeamBtn
          teamId={match.teamB}
          label={match.labelB}
          isWinner={match.winnerId !== null && match.winnerId === match.teamB}
          disabled={!ready}
          onClick={() => match.teamB && onChoice(match.id, match.teamB)}
        />
      </div>
    </div>
  );
}

interface Props {
  state: BracketState;
  onChoice: (matchId: string, winnerId: string) => void;
}

export function BracketView({ state, onChoice }: Props) {
  const byRound = useMemo(() => {
    const map = new Map<BracketRound, BracketMatchState[]>(
      ROUND_ORDER.map((r) => [r, []]),
    );
    for (const tmpl of BRACKET_TEMPLATE) {
      const ms = state.matches[tmpl.id];
      if (ms) map.get(ms.round)?.push(ms);
    }
    return map;
  }, [state]);

  return (
    <div className="mt-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Passo 3 de 4
        </p>
        <h2 className="text-xl font-bold text-slate-900">Bracket</h2>
        <p className="mt-1 text-sm text-slate-500">
          Clica no vencedor de cada jogo. As escolhas propagam-se automaticamente para as rondas seguintes.
        </p>
      </div>

      <div className="space-y-8">
        {ROUND_ORDER.map((round) => {
          const matches = byRound.get(round) ?? [];
          if (!matches.length) return null;

          const isFinal = round === "final";

          return (
            <section key={round}>
              <h3
                className={[
                  "mb-3 text-xs font-bold uppercase tracking-wider",
                  isFinal ? "text-amber-600" : "text-slate-600",
                ].join(" ")}
              >
                {ROUND_LABELS[round]}
              </h3>
              <div className={`grid gap-2.5 ${ROUND_GRID[round]}`}>
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} onChoice={onChoice} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
