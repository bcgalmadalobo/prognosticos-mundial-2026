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

type MatchState = "terminado" | "em_jogo" | "fecha_breve" | "aberto" | "fechado";

function getMatchState(match: KnockoutMatch): MatchState {
  if (match.status === "finished") return "terminado";
  if (match.status === "live") return "em_jogo";
  if (!isBettingOpen(match)) return "fechado";
  const minutesLeft = (bettingDeadline(match.startsAt).getTime() - Date.now()) / 60_000;
  return minutesLeft <= 60 ? "fecha_breve" : "aberto";
}

function formatDeadline(startsAt: string): string {
  return bettingDeadline(startsAt).toLocaleString("pt-PT", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function result90Label(r: KnockoutResult90, a: string, b: string): string {
  if (r === "teamA") return `Vitória ${a}`;
  if (r === "teamB") return `Vitória ${b}`;
  return "Empate";
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
  const state = getMatchState(match);
  const open = state === "aberto" || state === "fecha_breve";
  const needsFinal = requiresFinalScore(match.round);
  const teamsKnown = Boolean(match.teamA && match.teamB);

  return (
    <Protected>
      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/jogos" className="text-sm text-pitch-400 hover:text-neon-400">← Jogos</Link>
          <span className="text-pitch-600">/</span>
          <span className="text-sm text-pitch-400">{match.id}</span>
        </div>

        {/* Status banner */}
        {state === "aberto" && (
          <div className="flex items-center gap-2 rounded-xl bg-neon-500/10 border border-neon-500/30 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-neon-400 shrink-0" />
            <p className="text-sm text-neon-300 font-medium">
              Apostas abertas · fecha a {formatDeadline(match.startsAt)}
            </p>
          </div>
        )}
        {state === "fecha_breve" && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-sm text-amber-300 font-medium">
              Fecha em breve · prazo: {formatDeadline(match.startsAt)}
            </p>
          </div>
        )}
        {state === "fechado" && (
          <div className="flex items-center gap-2 rounded-xl bg-pitch-700/50 border border-pitch-600 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-pitch-500 shrink-0" />
            <p className="text-sm text-pitch-400">Apostas fechadas</p>
          </div>
        )}
        {state === "em_jogo" && (
          <div className="flex items-center gap-2 rounded-xl bg-green-700/20 border border-green-500/30 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-sm text-green-400 font-medium">Em jogo</p>
          </div>
        )}
        {state === "terminado" && (
          <div className="flex items-center gap-2 rounded-xl bg-pitch-700/30 border border-pitch-600 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-pitch-500 shrink-0" />
            <p className="text-sm text-pitch-400">Jogo terminado</p>
          </div>
        )}

        {/* Match header */}
        <Card accent="brand">
          <div className="space-y-3">
            <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-300">
              {ROUND_LABELS[match.round]}
            </span>
            <h1 className="text-xl font-bold text-pitch-50">
              {teamALabel} <span className="text-pitch-400 font-normal mx-1">vs</span> {teamBLabel}
            </h1>
            <div className="text-sm text-pitch-300 space-y-0.5">
              <p>{match.venue}, {match.city}, {match.country}</p>
              <p>{match.displayTimePortugal} (Portugal)</p>
            </div>
            {(match.oddsTeamA || match.oddsDraw || match.oddsTeamB) && (
              <div className="flex gap-2 pt-1">
                {match.oddsTeamA && (
                  <div className="flex-1 rounded-lg bg-pitch-700/60 border border-pitch-600 px-2 py-2 text-center min-w-0">
                    <p className="text-[10px] text-pitch-500 truncate leading-none mb-1">{teamALabel}</p>
                    <p className="text-base font-bold text-pitch-100">{match.oddsTeamA}</p>
                  </div>
                )}
                {match.oddsDraw && (
                  <div className="rounded-lg bg-pitch-700/60 border border-pitch-600 px-4 py-2 text-center">
                    <p className="text-[10px] text-pitch-500 leading-none mb-1">X</p>
                    <p className="text-base font-bold text-pitch-100">{match.oddsDraw}</p>
                  </div>
                )}
                {match.oddsTeamB && (
                  <div className="flex-1 rounded-lg bg-pitch-700/60 border border-pitch-600 px-2 py-2 text-center min-w-0">
                    <p className="text-[10px] text-pitch-500 truncate leading-none mb-1">{teamBLabel}</p>
                    <p className="text-base font-bold text-pitch-100">{match.oddsTeamB}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Result (if finished) */}
        {match.status === "finished" && (
          <Card title="Resultado">
            <div className="space-y-2 text-sm text-pitch-200">
              {match.result90 && (
                <div className="flex items-center justify-between">
                  <span className="text-pitch-400">90 min</span>
                  <strong>{result90Label(match.result90, teamALabel, teamBLabel)}</strong>
                </div>
              )}
              {match.resultFinal && (
                <div className="flex items-center justify-between">
                  <span className="text-pitch-400">Resultado final</span>
                  <strong className="text-lg font-mono">
                    {match.resultFinal.scoreTeamA} – {match.resultFinal.scoreTeamB}
                  </strong>
                </div>
              )}
              {match.winnerTeamId && (
                <div className="flex items-center justify-between">
                  <span className="text-pitch-400">Passou</span>
                  <strong className="text-neon-400">
                    {match.winnerTeamId === match.teamA ? teamALabel : teamBLabel}
                  </strong>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Read-only prediction (betting closed) */}
        {!open && prediction && (
          <Card title="A tua aposta">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-pitch-400">90 min</span>
                <strong className="text-pitch-100">{result90Label(prediction.result90, teamALabel, teamBLabel)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-pitch-400">Passa</span>
                <strong className="text-pitch-100">
                  {prediction.qualifierTeamId === match.teamA ? teamALabel : teamBLabel}
                </strong>
              </div>
              {prediction.scoreFinalTeamA !== undefined && prediction.scoreFinalTeamB !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-pitch-400">Resultado final</span>
                  <strong className="text-pitch-100 font-mono text-base">
                    {prediction.scoreFinalTeamA} – {prediction.scoreFinalTeamB}
                  </strong>
                </div>
              )}
              {prediction.points !== undefined && (
                <div className="flex items-center justify-between border-t border-pitch-600 pt-2 mt-2">
                  <span className="text-pitch-400">Pontos obtidos</span>
                  <strong className={`text-base ${prediction.points > 0 ? "text-neon-400" : "text-pitch-300"}`}>
                    {prediction.points} pts
                  </strong>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* No prediction, betting closed */}
        {!open && !prediction && match.status !== "finished" && (
          <Card>
            <p className="text-pitch-400 text-sm">Não fizeste aposta para este jogo.</p>
          </Card>
        )}

        {/* Teams not yet defined */}
        {open && !teamsKnown && (
          <Card>
            <div className="py-4 text-center">
              <p className="font-medium text-pitch-300 mb-1">Equipas ainda por definir</p>
              <p className="text-sm text-pitch-500">As apostas abrirão quando os slots forem preenchidos.</p>
            </div>
          </Card>
        )}

        {/* Betting form */}
        {open && teamsKnown && (
          <Card title={prediction ? "Editar aposta" : "Fazer aposta"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pitch-300">
                  Resultado aos 90 minutos
                </label>
                <select
                  className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-3 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pitch-300">
                  Equipa que passa
                </label>
                <p className="mb-2 text-xs text-pitch-500">
                  Após prolongamento ou penáltis, se necessário.
                </p>
                <select
                  className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-3 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none"
                  value={qualifierTeamId}
                  onChange={(e) => setQualifierTeamId(e.target.value)}
                  required
                >
                  <option value={match.teamA ?? ""}>{teamALabel}</option>
                  <option value={match.teamB ?? ""}>{teamBLabel}</option>
                </select>
              </div>

              {needsFinal && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pitch-300">
                    Resultado final
                  </label>
                  <p className="mb-2 text-xs text-pitch-500">
                    Golos após 120 min (inclui prolongamento). Se empate, indica quem passa nos penáltis no campo acima.
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-pitch-500 mb-1 truncate">{teamALabel}</p>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-3 text-center text-lg font-bold text-pitch-50 focus:border-neon-500 focus:outline-none"
                        placeholder="0"
                        value={scoreFinalTeamA}
                        onChange={(e) => setScoreFinalTeamA(e.target.value)}
                        required
                      />
                    </div>
                    <span className="mb-3 text-xl font-bold text-pitch-400">–</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-pitch-500 mb-1 truncate">{teamBLabel}</p>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-3 text-center text-lg font-bold text-pitch-50 focus:border-neon-500 focus:outline-none"
                        placeholder="0"
                        value={scoreFinalTeamB}
                        onChange={(e) => setScoreFinalTeamB(e.target.value)}
                        required
                      />
                    </div>
                  </div>
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
        )}
      </main>
    </Protected>
  );
}
