"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { ROUND_LABELS } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutRound } from "@/types";

const ROUND_ORDER: KnockoutRound[] = [
  "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final",
];

function statusBadgeCls(s: string) {
  if (s === "finished") return "bg-pitch-600 text-pitch-300";
  if (s === "live") return "bg-green-700/40 text-green-400";
  return "bg-pitch-700 text-pitch-300";
}

function statusLabel(s: string) {
  if (s === "finished") return "Terminado";
  if (s === "live") return "Em jogo";
  return "Agendado";
}

function NotifDot({ status }: { status?: string | null }) {
  const cls =
    status === "sent"    ? "bg-green-400" :
    status === "failed"  ? "bg-red-400" :
    status === "sending" ? "bg-yellow-400" :
    "bg-pitch-600";
  const title = status === "sent" ? "Notif enviada" : status === "failed" ? "Notif falhou" : status === "sending" ? "A enviar notif" : "Notif pendente";
  return <span className={`h-2 w-2 rounded-full shrink-0 ${cls}`} title={title} />;
}

export default function AdminJogosPage() {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [seedMsg, setSeedMsg] = useState("");
  const [seedErr, setSeedErr] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcResult, setRecalcResult] = useState<{
    matchesProcessed: number;
    predictionsProcessed: number;
    usersUpdated: number;
    warnings: string[];
  } | null>(null);
  const [recalcErr, setRecalcErr] = useState("");
  const [importOddsBusy, setImportOddsBusy] = useState(false);
  const [importOddsResult, setImportOddsResult] = useState<{
    checked: number;
    eligible: number;
    imported: number;
    skipped: number;
    failed: number;
    warnings: string[];
    dryRun: boolean;
  } | null>(null);
  const [importOddsErr, setImportOddsErr] = useState("");
  const [importResultsBusy, setImportResultsBusy] = useState(false);
  const [importResultsResult, setImportResultsResult] = useState<{
    checked: number;
    updated: number;
    skipped: number;
    failed: number;
    warnings: string[];
    dryRun: boolean;
  } | null>(null);
  const [importResultsErr, setImportResultsErr] = useState("");

  async function fetchMatches() {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setLoadErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch("/api/admin/knockout-matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { matches?: KnockoutMatch[]; error?: string };
      if (!res.ok) { setLoadErr(data.error ?? "Erro ao carregar jogos."); return; }
      setMatches(data.matches ?? []);
    } catch {
      setLoadErr("Erro de rede ao carregar jogos.");
    }
  }

  useEffect(() => {
    fetchMatches().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecalc() {
    setRecalcBusy(true);
    setRecalcResult(null);
    setRecalcErr("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setRecalcErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch("/api/admin/recalculate-knockout-points", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as {
        success?: boolean;
        matchesProcessed?: number;
        predictionsProcessed?: number;
        usersUpdated?: number;
        warnings?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido.");
      setRecalcResult({
        matchesProcessed: data.matchesProcessed ?? 0,
        predictionsProcessed: data.predictionsProcessed ?? 0,
        usersUpdated: data.usersUpdated ?? 0,
        warnings: data.warnings ?? [],
      });
    } catch (e) {
      setRecalcErr(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setRecalcBusy(false);
    }
  }

  async function handleImportOdds(dryRun: boolean) {
    setImportOddsBusy(true);
    setImportOddsResult(null);
    setImportOddsErr("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setImportOddsErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch("/api/admin/import-odds", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json() as {
        ok?: boolean;
        checked?: number;
        eligible?: number;
        imported?: number;
        skipped?: number;
        failed?: number;
        warnings?: string[];
        dryRun?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao importar odds.");
      setImportOddsResult({
        checked: data.checked ?? 0,
        eligible: data.eligible ?? 0,
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        failed: data.failed ?? 0,
        warnings: data.warnings ?? [],
        dryRun: data.dryRun ?? dryRun,
      });
      if (!dryRun) await fetchMatches();
    } catch (e) {
      setImportOddsErr(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setImportOddsBusy(false);
    }
  }

  async function handleImportResults(dryRun: boolean) {
    setImportResultsBusy(true);
    setImportResultsResult(null);
    setImportResultsErr("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setImportResultsErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch("/api/admin/import-results", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json() as {
        ok?: boolean;
        checked?: number;
        updated?: number;
        skipped?: number;
        failed?: number;
        warnings?: string[];
        dryRun?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao importar resultados.");
      setImportResultsResult({
        checked: data.checked ?? 0,
        updated: data.updated ?? 0,
        skipped: data.skipped ?? 0,
        failed: data.failed ?? 0,
        warnings: data.warnings ?? [],
        dryRun: data.dryRun ?? dryRun,
      });
      if (!dryRun) await fetchMatches();
    } catch (e) {
      setImportResultsErr(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setImportResultsBusy(false);
    }
  }

  async function handleSeed() {
    setSeedMsg("");
    setSeedErr("");
    setSeeding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setSeedErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch("/api/admin/seed-matches", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { ok?: boolean; created?: number; updated?: number; total?: number; error?: string; details?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setSeedMsg(`Importado: ${data.created} novos, ${data.updated} atualizados (${data.total} total).`);
      setLoadErr("");
      await fetchMatches();
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
        <div className="flex flex-wrap items-start justify-between gap-4">
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

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-pitch-500 bg-pitch-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-pitch-100">Recalcular pontos eliminatórios</p>
            <p className="text-xs text-pitch-400">Recalcula matchPredictions e leaderboard a partir dos jogos com status "finished".</p>
          </div>
          <Button onClick={handleRecalc} disabled={recalcBusy} variant="secondary">
            {recalcBusy ? "A calcular…" : "Recalcular pontos"}
          </Button>
        </div>

        {recalcResult && (
          <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-4 text-sm">
            <p className="font-semibold text-green-400 mb-2">Recálculo concluído</p>
            <ul className="space-y-1 text-pitch-200">
              <li>Jogos processados: <span className="font-mono text-pitch-50">{recalcResult.matchesProcessed}</span></li>
              <li>Apostas processadas: <span className="font-mono text-pitch-50">{recalcResult.predictionsProcessed}</span></li>
              <li>Utilizadores atualizados: <span className="font-mono text-pitch-50">{recalcResult.usersUpdated}</span></li>
            </ul>
            {recalcResult.warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-yellow-400 mb-1">Avisos ({recalcResult.warnings.length})</p>
                <ul className="space-y-0.5">
                  {recalcResult.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-300 font-mono">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {recalcErr && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {recalcErr}
          </div>
        )}

        {/* Import odds block */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-pitch-500 bg-pitch-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-pitch-100">Importar odds automáticas</p>
            <p className="text-xs text-pitch-400">
              Busca odds na The Odds API para jogos agendados nas próximas 24h sem odds bloqueadas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleImportOdds(true)} disabled={importOddsBusy} variant="secondary">
              {importOddsBusy ? "A verificar…" : "Simular (dry run)"}
            </Button>
            <Button onClick={() => handleImportOdds(false)} disabled={importOddsBusy} variant="gold">
              {importOddsBusy ? "A importar…" : "Importar odds agora"}
            </Button>
          </div>
        </div>

        {importOddsResult && (
          <div className={`rounded-xl border p-4 text-sm ${importOddsResult.dryRun ? "border-amber-500/30 bg-amber-900/20" : "border-green-500/30 bg-green-900/30"}`}>
            <p className={`font-semibold mb-2 ${importOddsResult.dryRun ? "text-amber-400" : "text-green-400"}`}>
              {importOddsResult.dryRun ? "Simulação concluída (sem alterações)" : "Importação concluída"}
            </p>
            <ul className="space-y-1 text-pitch-200">
              <li>Jogos verificados: <span className="font-mono text-pitch-50">{importOddsResult.checked}</span></li>
              <li>Elegíveis (próximas 24h): <span className="font-mono text-pitch-50">{importOddsResult.eligible}</span></li>
              <li>Odds importadas: <span className="font-mono text-pitch-50">{importOddsResult.imported}</span></li>
              <li>Ignorados (fora da janela / já bloqueados): <span className="font-mono text-pitch-50">{importOddsResult.skipped}</span></li>
              {importOddsResult.failed > 0 && (
                <li>Falhas: <span className="font-mono text-red-400">{importOddsResult.failed}</span></li>
              )}
            </ul>
            {importOddsResult.warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-yellow-400 mb-1">Avisos ({importOddsResult.warnings.length})</p>
                <ul className="space-y-0.5">
                  {importOddsResult.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-300 font-mono">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {importOddsErr && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {importOddsErr}
          </div>
        )}

        {/* Import results block */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-pitch-500 bg-pitch-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-pitch-100">Importar resultados automáticos</p>
            <p className="text-xs text-pitch-400">
              Busca resultados na API-Football para jogos com kick-off passado e sem status "finished".
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleImportResults(true)} disabled={importResultsBusy} variant="secondary">
              {importResultsBusy ? "A verificar…" : "Simular (dry run)"}
            </Button>
            <Button onClick={() => handleImportResults(false)} disabled={importResultsBusy} variant="gold">
              {importResultsBusy ? "A importar…" : "Importar resultados agora"}
            </Button>
          </div>
        </div>

        {importResultsResult && (
          <div className={`rounded-xl border p-4 text-sm ${importResultsResult.dryRun ? "border-amber-500/30 bg-amber-900/20" : "border-green-500/30 bg-green-900/30"}`}>
            <p className={`font-semibold mb-2 ${importResultsResult.dryRun ? "text-amber-400" : "text-green-400"}`}>
              {importResultsResult.dryRun ? "Simulação concluída (sem alterações)" : "Importação de resultados concluída"}
            </p>
            <ul className="space-y-1 text-pitch-200">
              <li>Jogos verificados: <span className="font-mono text-pitch-50">{importResultsResult.checked}</span></li>
              <li>Resultados atualizados: <span className="font-mono text-pitch-50">{importResultsResult.updated}</span></li>
              <li>Ignorados (já terminados / ainda não começaram): <span className="font-mono text-pitch-50">{importResultsResult.skipped}</span></li>
              {importResultsResult.failed > 0 && (
                <li>Falhas: <span className="font-mono text-red-400">{importResultsResult.failed}</span></li>
              )}
            </ul>
            {importResultsResult.warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-yellow-400 mb-1">Avisos ({importResultsResult.warnings.length})</p>
                <ul className="space-y-0.5">
                  {importResultsResult.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-300 font-mono">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {importResultsErr && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {importResultsErr}
          </div>
        )}

        {loadErr && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {loadErr}
          </div>
        )}

        {loading ? (
          <p className="text-pitch-400">A carregar…</p>
        ) : matches.length === 0 && !loadErr ? (
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
                  <span className="text-xs text-pitch-500">{list.length} jogo{list.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-1.5">
                  {list.map((match) => {
                    const teamA = match.teamAName ?? match.slotA;
                    const teamB = match.teamBName ?? match.slotB;
                    const oddsParts: string[] = [];
                    if (match.oddsTeamA) oddsParts.push(String(match.oddsTeamA));
                    if (match.oddsDraw) oddsParts.push(`X ${match.oddsDraw}`);
                    if (match.oddsTeamB) oddsParts.push(String(match.oddsTeamB));
                    const oddsStr = oddsParts.length > 0 ? oddsParts.join(" · ") : null;

                    return (
                      <Link
                        key={match.id}
                        href={`/admin/jogos/${match.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-pitch-500 bg-pitch-800 px-4 py-3 transition hover:border-neon-500/60 hover:bg-pitch-700/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 text-xs font-mono text-pitch-500">{match.id}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-pitch-50 truncate">
                              {teamA} <span className="text-pitch-500">vs</span> {teamB}
                            </p>
                            {oddsStr && (
                              <p className="mt-0.5 text-[11px] font-mono text-pitch-500">{oddsStr}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <NotifDot status={match.notificationStatus} />
                          <span className="hidden sm:inline text-xs text-pitch-400">
                            {match.displayTimePortugal}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeCls(match.status)}`}>
                            {statusLabel(match.status)}
                          </span>
                          {match.bettingOpen && (
                            <span className="hidden sm:inline rounded-full bg-neon-500/20 px-2 py-0.5 text-xs font-medium text-neon-400">
                              Aberta
                            </span>
                          )}
                          <span className="text-pitch-500 text-xs ml-1">→</span>
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
