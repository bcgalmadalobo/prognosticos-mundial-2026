"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { listKnockoutMatches } from "@/lib/db";
import { ROUND_LABELS } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutRound } from "@/types";

const ROUND_ORDER: KnockoutRound[] = [
  "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final",
];

const statusBadge = (s: string) => {
  if (s === "finished") return "bg-pitch-600 text-pitch-300";
  if (s === "live") return "bg-green-700/40 text-green-400";
  return "bg-pitch-700 text-pitch-300";
};

export default function AdminJogosPage() {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedMsg, setSeedMsg] = useState("");
  const [seedErr, setSeedErr] = useState("");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    listKnockoutMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  async function handleSeed() {
    setSeedMsg("");
    setSeedErr("");
    setSeeding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/seed-matches", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { ok?: boolean; created?: number; updated?: number; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setSeedMsg(`Importado: ${data.created} novos, ${data.updated} atualizados (${data.total} total).`);
      const updated = await listKnockoutMatches();
      setMatches(updated);
    } catch (e) {
      setSeedErr(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setSeeding(false);
    }
  }

  const grouped = ROUND_ORDER.reduce<Record<KnockoutRound, KnockoutMatch[]>>((acc, r) => {
    acc[r] = matches.filter((m) => m.round === r);
    return acc;
  }, {} as Record<KnockoutRound, KnockoutMatch[]>);

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-5xl space-y-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Jogos Eliminatórios</h1>
            <p className="mt-1 text-sm text-pitch-300">M73–M104 · {matches.length} jogos carregados</p>
          </div>
          <Button onClick={handleSeed} disabled={seeding} variant="gold">
            {seeding ? "A importar…" : "Importar / Atualizar Jogos Oficiais"}
          </Button>
        </div>

        {seedMsg && (
          <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">
            {seedMsg}
          </div>
        )}
        {seedErr && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {seedErr}
          </div>
        )}

        {loading ? (
          <p className="text-pitch-400">A carregar…</p>
        ) : matches.length === 0 ? (
          <Card>
            <p className="text-pitch-300">Nenhum jogo carregado. Clica em "Importar" para criar os 32 jogos oficiais.</p>
          </Card>
        ) : (
          ROUND_ORDER.map((round) => {
            const list = grouped[round];
            if (list.length === 0) return null;
            return (
              <div key={round}>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-pitch-400">
                    {ROUND_LABELS[round]}
                  </h2>
                  <div className="h-px flex-1 bg-pitch-600" />
                </div>
                <div className="space-y-2">
                  {list.map((match) => {
                    const teamA = match.teamAName ?? match.slotA;
                    const teamB = match.teamBName ?? match.slotB;
                    return (
                      <Link
                        key={match.id}
                        href={`/admin/jogos/${match.id}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-pitch-500 bg-pitch-800 px-4 py-3 transition hover:border-neon-500/60 hover:bg-pitch-700/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 text-xs font-mono text-pitch-400">{match.id}</span>
                          <span className="font-medium text-pitch-50 truncate">
                            {teamA} <span className="text-pitch-400">vs</span> {teamB}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline text-xs text-pitch-400">
                            {match.displayTimePortugal}
                          </span>
                          <span className="hidden sm:inline text-xs text-pitch-400">
                            {match.venue}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(match.status)}`}>
                            {match.status}
                          </span>
                          {match.bettingOpen && (
                            <span className="rounded-full bg-neon-500/20 px-2 py-0.5 text-xs font-medium text-neon-400">
                              aberta
                            </span>
                          )}
                          <span className="text-pitch-400 text-sm">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>
    </Protected>
  );
}
