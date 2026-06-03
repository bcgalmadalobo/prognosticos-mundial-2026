"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";
import { listKnockoutMatches, listUserKnockoutPredictions } from "@/lib/db";
import { ROUND_LABELS, isBettingOpen, bettingDeadline } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchPrediction, KnockoutRound } from "@/types";

const ROUND_ORDER: KnockoutRound[] = [
  "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final",
];

type MatchState = "terminado" | "em_jogo" | "fecha_breve" | "aberto" | "fechado";

function getMatchState(match: KnockoutMatch): MatchState {
  if (match.status === "finished") return "terminado";
  if (match.status === "live") return "em_jogo";
  if (!isBettingOpen(match)) return "fechado";
  const minutesLeft = (bettingDeadline(match.startsAt).getTime() - Date.now()) / 60_000;
  return minutesLeft <= 60 ? "fecha_breve" : "aberto";
}

const STATE_BADGE: Record<MatchState, { label: string; cls: string }> = {
  terminado:   { label: "Terminado",      cls: "bg-pitch-600 text-pitch-300" },
  em_jogo:     { label: "Em jogo",        cls: "bg-green-700/40 text-green-400" },
  fecha_breve: { label: "Fecha em breve", cls: "bg-amber-500/20 text-amber-400" },
  aberto:      { label: "Aberto",         cls: "bg-neon-500/20 text-neon-400" },
  fechado:     { label: "Fechado",        cls: "bg-pitch-700 text-pitch-400" },
};

function MatchCard({ match, hasPrediction }: { match: KnockoutMatch; hasPrediction: boolean }) {
  const teamA = match.teamAName ?? match.slotA;
  const teamB = match.teamBName ?? match.slotB;
  const state = getMatchState(match);
  const badge = STATE_BADGE[state];
  const isOpen = state === "aberto" || state === "fecha_breve";
  const hasOdds = match.oddsTeamA || match.oddsDraw || match.oddsTeamB;
  const deadline = isOpen
    ? bettingDeadline(match.startsAt).toLocaleString("pt-PT", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <Link
      href={`/jogos/${match.id}`}
      className="block rounded-2xl border border-pitch-500 bg-pitch-800 p-4 transition hover:border-neon-500/60 hover:bg-pitch-700/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-pitch-500 mb-1">{match.venue}, {match.city}</p>
          <p className="font-semibold text-pitch-50">
            {teamA} <span className="text-pitch-400 mx-1">vs</span> {teamB}
          </p>
          <p className="mt-1 text-xs text-pitch-400">{match.displayTimePortugal}</p>
          {isOpen && deadline && (
            <p className="mt-0.5 text-xs text-neon-400">Aposta até {deadline}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
          {hasPrediction && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Apostado
            </span>
          )}
        </div>
      </div>

      {hasOdds && (
        <div className="mt-3 flex gap-2">
          {match.oddsTeamA && (
            <div className="flex-1 rounded-lg bg-pitch-700/60 px-2 py-1.5 text-center min-w-0">
              <p className="text-[10px] text-pitch-500 truncate leading-none mb-0.5">{teamA}</p>
              <p className="text-sm font-bold text-pitch-200">{match.oddsTeamA}</p>
            </div>
          )}
          {match.oddsDraw && (
            <div className="rounded-lg bg-pitch-700/60 px-3 py-1.5 text-center">
              <p className="text-[10px] text-pitch-500 leading-none mb-0.5">X</p>
              <p className="text-sm font-bold text-pitch-200">{match.oddsDraw}</p>
            </div>
          )}
          {match.oddsTeamB && (
            <div className="flex-1 rounded-lg bg-pitch-700/60 px-2 py-1.5 text-center min-w-0">
              <p className="text-[10px] text-pitch-500 truncate leading-none mb-0.5">{teamB}</p>
              <p className="text-sm font-bold text-pitch-200">{match.oddsTeamB}</p>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

export default function JogosPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [predictedIds, setPredictedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listKnockoutMatches(),
      listUserKnockoutPredictions(user.uid).catch(() => [] as KnockoutMatchPrediction[]),
    ])
      .then(([ms, preds]) => {
        setMatches(ms);
        setPredictedIds(new Set(preds.map((p) => p.matchId)));
      })
      .catch(() => setError("Erro ao carregar jogos."))
      .finally(() => setLoading(false));
  }, [user]);

  const grouped = ROUND_ORDER.reduce<Record<KnockoutRound, KnockoutMatch[]>>((acc, r) => {
    acc[r] = matches.filter((m) => m.round === r);
    return acc;
  }, {} as Record<KnockoutRound, KnockoutMatch[]>);

  return (
    <Protected>
      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
        <h1 className="text-2xl font-bold text-pitch-50">Jogos eliminatórios</h1>

        {error && (
          <p className="rounded-xl bg-red-900/30 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-pitch-400">A carregar…</p>
        ) : matches.length === 0 ? (
          <Card>
            <p className="text-pitch-300">Jogos ainda não disponíveis.</p>
          </Card>
        ) : (
          ROUND_ORDER.map((round) => {
            const list = grouped[round];
            if (list.length === 0) return null;
            const betCount = list.filter((m) => predictedIds.has(m.id)).length;
            return (
              <div key={round}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-pitch-400">
                    {ROUND_LABELS[round]}
                  </h2>
                  <div className="h-px flex-1 bg-pitch-600" />
                  <span className="text-xs text-pitch-500">{list.length} jogo{list.length !== 1 ? "s" : ""}</span>
                  {betCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {betCount}/{list.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map((m) => (
                    <MatchCard key={m.id} match={m} hasPrediction={predictedIds.has(m.id)} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </main>
    </Protected>
  );
}
