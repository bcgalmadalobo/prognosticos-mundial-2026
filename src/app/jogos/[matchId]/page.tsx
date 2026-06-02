"use client";

import { FormEvent, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { getKnockoutMatch } from "@/lib/db";
import {
  validateKnockoutPrediction,
  requiresFinalScore,
  isBettingOpen,
  bettingDeadline,
  ROUND_LABELS,
} from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchPrediction, KnockoutResult90 } from "@/types";

interface PageProps { params: Promise<{ matchId: string }> }

function formatDeadline(startsAt: string): string {
  const d = bettingDeadline(startsAt);
  return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

export default function MatchPage({ params }: PageProps) {
  const { matchId } = use(params);
  const { user } = useAuth();

  const [match, setMatch] = useState<KnockoutMatch | null>(null);
  const [prediction, setPrediction] = useState<KnockoutMatchPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [result90, setResult90] = useState<KnockoutResult90>("teamA");
  const [qualifierTeamId, setQualifierTeamId] = useState("");
  const [scoreFinalTeamA, setScoreFinalTeamA] = useState("");
  const [scoreFinalTeamB, setScoreFinalTeamB] = useState("");
  const [formErr, setFormErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getKnockoutMatch(matchId),
      fetchPrediction(),
    ]).then(([m]) => {
      setMatch(m);
      if (m?.teamA) setQualifierTeamId(m.teamA);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user]);

  async function fetchPrediction() {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/knockout-matches/${matchId}/predict`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { prediction: KnockoutMatchPrediction | null };
      if (data.prediction) {
        const p = data.prediction;
        setPrediction(p);
        setResult90(p.result90);
        setQualifierTeamId(p.qualifierTeamId);
        if (p.scoreFinalTeamA !== undefined) setScoreFinalTeamA(String(p.scoreFinalTeamA));
        if (p.scoreFinalTeamB !== undefined) setScoreFinalTeamB(String(p.scoreFinalTeamB));
      }
    } catch {
      // silent – prediction just won't be pre-filled
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormErr("");
    setSaved(false);

    if (!match?.teamA || !match?.teamB) {
      setFormErr("As equipas ainda não foram definidas.");
      return;
    }

    const needsFinal = requiresFinalScore(match.round);
    const sA = needsFinal ? parseInt(scoreFinalTeamA, 10) : undefined;
    const sB = needsFinal ? parseInt(scoreFinalTeamB, 10) : undefined;

    const clientErr = validateKnockoutPrediction(
      { result90, qualifierTeamId, scoreFinalTeamA: sA, scoreFinalTeamB: sB },
      match.teamA,
      match.teamB,
      match.round
    );
    if (clientErr) { setFormErr(clientErr); return; }

    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/knockout-matches/${matchId}/predict`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ result90, qualifierTeamId, scoreFinalTeamA: sA, scoreFinalTeamB: sB }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setSaved(true);
      await fetchPrediction();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Erro ao guardar aposta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Protected><main className="p-4 text-pitch-400">A carregar…</main></Protected>;
  if (!match) return <Protected><main className="p-4 text-pitch-400">Jogo não encontrado.</main></Protected>;

  const teamALabel = match.teamAName ?? match.slotA;
  const teamBLabel = match.teamBName ?? match.slotB;
  const open = isBettingOpen(match);
  const needsFinal = requiresFinalScore(match.round);

  return (
    <Protected>
      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
        <div className="flex items-center gap-2">
          <Link href="/jogos" className="text-sm text-pitch-400 hover:text-neon-400">← Jogos</Link>
          <span className="text-pitch-600">/</span>
          <span className="text-sm text-pitch-400">{match.id}</span>
        </div>

        {/* Match header */}
        <Card accent="brand">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-300">
                {ROUND_LABELS[match.round]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                match.status === "finished" ? "bg-pitch-600 text-pitch-300" :
                match.status === "live" ? "bg-green-700/40 text-green-400" :
                "bg-pitch-700 text-pitch-300"
              }`}>
                {match.status === "finished" ? "Terminado" : match.status === "live" ? "Em jogo" : "Agendado"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-pitch-50">
              {teamALabel} <span className="text-pitch-400">vs</span> {teamBLabel}
            </h1>
            <div className="text-sm text-pitch-300">
              <p>{match.venue}, {match.city}, {match.country}</p>
              <p>
                {match.displayTimePortugal} (Portugal) ·{" "}
                {open ? (
                  <span className="text-neon-400 font-medium">Aposta aberta até {formatDeadline(match.startsAt)}</span>
                ) : match.status === "scheduled" ? (
                  <span className="text-amber-400">Prazo de aposta esgotado</span>
                ) : null}
              </p>
              {!match.bettingOpen && match.status === "scheduled" && (
                <p className="text-amber-400 font-medium">Apostas fechadas pelo admin.</p>
              )}
            </div>
            {(match.oddsTeamA || match.oddsDraw || match.oddsTeamB) && (
              <div className="flex gap-3 pt-1 text-xs text-pitch-400">
                {match.oddsTeamA && <span>{teamALabel} <strong className="text-pitch-200">{match.oddsTeamA}</strong></span>}
                {match.oddsDraw && <span>Empate <strong className="text-pitch-200">{match.oddsDraw}</strong></span>}
                {match.oddsTeamB && <span>{teamBLabel} <strong className="text-pitch-200">{match.oddsTeamB}</strong></span>}
              </div>
            )}
          </div>
        </Card>

        {/* Betting form or read-only view */}
        {match.status === "finished" ? (
          <Card title="Resultado">
            <div className="space-y-1 text-sm text-pitch-200">
              {match.result90 && <p>90 min: <strong>{match.result90 === "teamA" ? `Vitória ${teamALabel}` : match.result90 === "teamB" ? `Vitória ${teamBLabel}` : "Empate"}</strong></p>}
              {match.resultFinal && <p>Final: <strong>{match.resultFinal.scoreTeamA}–{match.resultFinal.scoreTeamB}</strong></p>}
              {match.winnerTeamId && <p>Passou: <strong>{match.winnerTeamId === match.teamA ? teamALabel : teamBLabel}</strong></p>}
            </div>
          </Card>
        ) : null}

        {!open && prediction ? (
          <Card title="A tua aposta (fechada)">
            <div className="space-y-1 text-sm text-pitch-200">
              <p>90 min: <strong>{prediction.result90 === "teamA" ? `Vitória ${teamALabel}` : prediction.result90 === "teamB" ? `Vitória ${teamBLabel}` : "Empate"}</strong></p>
              <p>Passa: <strong>{prediction.qualifierTeamId === match.teamA ? teamALabel : teamBLabel}</strong></p>
              {prediction.scoreFinalTeamA !== undefined && prediction.scoreFinalTeamB !== undefined && (
                <p>Resultado final: <strong>{prediction.scoreFinalTeamA}–{prediction.scoreFinalTeamB}</strong></p>
              )}
            </div>
          </Card>
        ) : !open && !prediction && match.status !== "finished" ? (
          <Card>
            <p className="text-pitch-400 text-sm">Não fizeste aposta para este jogo.</p>
          </Card>
        ) : null}

        {open && match.teamA && match.teamB ? (
          <Card title={prediction ? "Editar aposta" : "Fazer aposta"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Resultado aos 90 minutos</label>
                <select
                  className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
                  value={result90}
                  onChange={(e) => setResult90(e.target.value as KnockoutResult90)}
                  required
                >
                  <option value="teamA">Vitória {teamALabel}</option>
                  <option value="draw">Empate</option>
                  <option value="teamB">Vitória {teamBLabel}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Equipa que passa</label>
                <select
                  className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
                  value={qualifierTeamId}
                  onChange={(e) => setQualifierTeamId(e.target.value)}
                  required
                >
                  <option value={match.teamA}>{teamALabel}</option>
                  <option value={match.teamB}>{teamBLabel}</option>
                </select>
              </div>

              {needsFinal && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">
                    Resultado final (após 120 min se necessário)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-20 rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-center text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
                      placeholder="A"
                      value={scoreFinalTeamA}
                      onChange={(e) => setScoreFinalTeamA(e.target.value)}
                      required
                    />
                    <span className="text-pitch-400 font-bold">–</span>
                    <input
                      type="number"
                      min="0"
                      className="w-20 rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-center text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
                      placeholder="B"
                      value={scoreFinalTeamB}
                      onChange={(e) => setScoreFinalTeamB(e.target.value)}
                      required
                    />
                    <span className="text-xs text-pitch-400">{teamALabel} – {teamBLabel}</span>
                  </div>
                  <p className="mt-1 text-xs text-pitch-500">
                    Se empate aos 90 min e ao fim do tempo extra, indica empate — quem passa decide nos penáltis.
                  </p>
                </div>
              )}

              {formErr && (
                <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
                  {formErr}
                </div>
              )}

              {saved && (
                <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">
                  Aposta guardada!
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "A guardar…" : prediction ? "Atualizar aposta" : "Guardar aposta"}
              </Button>
            </form>
          </Card>
        ) : open && (!match.teamA || !match.teamB) ? (
          <Card>
            <p className="text-pitch-400 text-sm">As equipas ainda não foram definidas para este jogo.</p>
          </Card>
        ) : null}
      </main>
    </Protected>
  );
}
