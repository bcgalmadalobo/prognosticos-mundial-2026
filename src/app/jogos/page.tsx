"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { listKnockoutMatches } from "@/lib/db";
import { ROUND_LABELS, isBettingOpen, bettingDeadline } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutRound } from "@/types";

const ROUND_ORDER: KnockoutRound[] = [
  "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final",
];

function MatchCard({ match }: { match: KnockoutMatch }) {
  const teamA = match.teamAName ?? match.slotA;
  const teamB = match.teamBName ?? match.slotB;
  const open = isBettingOpen(match);
  const deadline = match.startsAt ? bettingDeadline(match.startsAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : null;

  return (
    <Link
      href={`/jogos/${match.id}`}
      className="block rounded-2xl border border-pitch-500 bg-pitch-800 p-4 transition hover:border-neon-500/60 hover:bg-pitch-700/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-pitch-400 mb-1">{match.id} · {match.venue}, {match.city}</p>
          <p className="font-semibold text-pitch-50">
            {teamA} <span className="text-pitch-400">vs</span> {teamB}
          </p>
          <p className="mt-1 text-xs text-pitch-300">{match.displayTimePortugal} (PT)</p>
          {open && deadline && (
            <p className="mt-0.5 text-xs text-neon-400">Aposta até {deadline}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {match.status === "finished" ? (
            <span className="rounded-full bg-pitch-600 px-2 py-0.5 text-xs text-pitch-300">Terminado</span>
          ) : match.status === "live" ? (
            <span className="rounded-full bg-green-700/40 px-2 py-0.5 text-xs text-green-400">Em jogo</span>
          ) : open ? (
            <span className="rounded-full bg-neon-500/20 px-2 py-0.5 text-xs font-medium text-neon-400">Aberta</span>
          ) : (
            <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-400">Fechada</span>
          )}
          <span className="text-pitch-500 text-xs">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function JogosPage() {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listKnockoutMatches()
      .then(setMatches)
      .catch(() => setError("Erro ao carregar jogos."))
      .finally(() => setLoading(false));
  }, []);

  const grouped = ROUND_ORDER.reduce<Record<KnockoutRound, KnockoutMatch[]>>((acc, r) => {
    acc[r] = matches.filter((m) => m.round === r);
    return acc;
  }, {} as Record<KnockoutRound, KnockoutMatch[]>);

  return (
    <Protected>
      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
        <h1 className="text-2xl font-bold text-pitch-50">Jogos eliminatórios</h1>

        {error && <p className="rounded-xl bg-red-900/30 border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}

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
            return (
              <div key={round}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-pitch-400">
                    {ROUND_LABELS[round]}
                  </h2>
                  <div className="h-px flex-1 bg-pitch-600" />
                </div>
                <div className="space-y-2">
                  {list.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            );
          })
        )}
      </main>
    </Protected>
  );
}
