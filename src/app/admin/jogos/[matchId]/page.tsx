"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { ROUND_LABELS, bettingDeadline } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchStatus, KnockoutResult90 } from "@/types";

const inputCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";
const selectCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

interface PageProps { params: Promise<{ matchId: string }> }

function formatIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function NotifStatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "pending") {
    return <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-400">Pendente</span>;
  }
  if (status === "sending") {
    return <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">A enviar…</span>;
  }
  if (status === "sent") {
    return <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Enviada</span>;
  }
  if (status === "failed") {
    return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Falhou</span>;
  }
  return <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-400">{status}</span>;
}

function computeDeadlinePreview(startsAt: string): string | null {
  try {
    const d = bettingDeadline(startsAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return null;
  }
}

export default function AdminMatchEditPage({ params }: PageProps) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<KnockoutMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyErr, setNotifyErr] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [deadlinePreview, setDeadlinePreview] = useState<string | null>(null);

  async function fetchMatch() {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setLoadErr("Sessão expirada. Recarrega a página."); return null; }
      const res = await fetch(`/api/admin/knockout-matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { match?: KnockoutMatch; error?: string };
      if (!res.ok) { setLoadErr(data.error ?? "Erro ao carregar jogo."); return null; }
      return data.match ?? null;
    } catch {
      setLoadErr("Erro de rede ao carregar jogo.");
      return null;
    }
  }

  useEffect(() => {
    fetchMatch()
      .then((m) => { if (m) setMatch(m); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (!match?.startsAt) return;
    setDeadlinePreview(computeDeadlinePreview(match.startsAt));
  }, [match?.startsAt]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  function handleStartsAtChange(e: ChangeEvent<HTMLInputElement>) {
    setDeadlinePreview(computeDeadlinePreview(e.target.value.trim()));
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const f = new FormData(e.currentTarget);
    const startsAt = String(f.get("startsAt") ?? "").trim();

    const updates: Record<string, unknown> = {
      teamA: String(f.get("teamA") ?? "").trim() || null,
      teamB: String(f.get("teamB") ?? "").trim() || null,
      bettingOpen: f.get("bettingOpen") === "on",
      status: f.get("status") as KnockoutMatchStatus,
    };

    const teamAName = String(f.get("teamAName") ?? "").trim();
    if (teamAName) updates.teamAName = teamAName;

    const teamBName = String(f.get("teamBName") ?? "").trim();
    if (teamBName) updates.teamBName = teamBName;

    const oddsTeamA = f.get("oddsTeamA");
    if (oddsTeamA) updates.oddsTeamA = Number(oddsTeamA);

    const oddsDraw = f.get("oddsDraw");
    if (oddsDraw) updates.oddsDraw = Number(oddsDraw);

    const oddsTeamB = f.get("oddsTeamB");
    if (oddsTeamB) updates.oddsTeamB = Number(oddsTeamB);

    const winnerTeamId = String(f.get("winnerTeamId") ?? "").trim();
    if (winnerTeamId) updates.winnerTeamId = winnerTeamId;

    if (startsAt) updates.startsAt = startsAt;

    const r90 = String(f.get("result90") ?? "").trim();
    if (r90) updates.result90 = r90 as KnockoutResult90;

    const sA = f.get("scoreFinalTeamA");
    const sB = f.get("scoreFinalTeamB");
    if (sA !== null && sA !== "" && sB !== null && sB !== "") {
      updates.resultFinal = { scoreTeamA: Number(sA), scoreTeamB: Number(sB) };
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch(`/api/admin/knockout-matches/${matchId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json() as { ok?: boolean; match?: KnockoutMatch; error?: string; details?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao guardar.");
      setMsg("Guardado com sucesso.");
      if (data.match) setMatch(data.match);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar.");
    }
  }

  async function handleNotify() {
    setNotifyMsg("");
    setNotifyErr("");
    setNotifying(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setNotifyErr("Sessão expirada. Recarrega a página."); return; }
      const res = await fetch(`/api/knockout-matches/${matchId}/notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { sent?: boolean; recipientCount?: number; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setNotifyMsg(
        data.sent
          ? `Notificação enviada para ${data.recipientCount} utilizadores.`
          : (data.message ?? "Nenhum utilizador com notificações ativas.")
      );
      const refreshed = await fetchMatch();
      if (refreshed) setMatch(refreshed);
    } catch (e) {
      setNotifyErr(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setNotifying(false);
    }
  }

  if (loading) return <Protected adminOnly><main className="p-4 text-pitch-400">A carregar…</main></Protected>;
  if (loadErr) return <Protected adminOnly><main className="p-4 text-red-400">{loadErr}</main></Protected>;
  if (!match) return <Protected adminOnly><main className="p-4 text-pitch-400">Jogo não encontrado.</main></Protected>;

  const slotALabel = match.teamAName ?? match.slotA;
  const slotBLabel = match.teamBName ?? match.slotB;

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/jogos" className="text-sm text-pitch-400 hover:text-neon-400">← Jogos</Link>
          <span className="text-pitch-600">/</span>
          <h1 className="text-xl font-bold text-pitch-50">{match.id}</h1>
          <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-300">
            {ROUND_LABELS[match.round]}
          </span>
        </div>

        {/* Read-only match info */}
        <div className="rounded-xl border border-pitch-600 bg-pitch-800/50 p-3 text-xs text-pitch-400 space-y-0.5">
          <p><span className="text-pitch-300">Slots:</span> {match.slotA} vs {match.slotB}</p>
          <p><span className="text-pitch-300">Venue:</span> {match.venue}, {match.city}, {match.country}</p>
          <p><span className="text-pitch-300">Hora UTC:</span> {match.startsAt}</p>
          <p><span className="text-pitch-300">Portugal:</span> {match.displayTimePortugal}</p>
          {deadlinePreview && (
            <p><span className="text-pitch-300">Deadline aposta:</span> <span className="text-amber-300">{deadlinePreview}</span></p>
          )}
          <p><span className="text-pitch-300">Fonte:</span> {match.sourceNote}</p>
        </div>

        {msg && (
          <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">
            {msg}
          </div>
        )}
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            {err}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Equipas */}
          <Card title="Equipas">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">ID Equipa A</label>
                <input name="teamA" className={inputCls} defaultValue={match.teamA ?? ""} placeholder={match.slotA} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">ID Equipa B</label>
                <input name="teamB" className={inputCls} defaultValue={match.teamB ?? ""} placeholder={match.slotB} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Nome Equipa A</label>
                <input name="teamAName" className={inputCls} defaultValue={match.teamAName ?? ""} placeholder="Ex: Portugal" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Nome Equipa B</label>
                <input name="teamBName" className={inputCls} defaultValue={match.teamBName ?? ""} placeholder="Ex: Espanha" />
              </div>
            </div>
          </Card>

          {/* Horário & Estado */}
          <Card title="Horário & Estado">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-pitch-300">
                  startsAt UTC (ISO 8601)
                </label>
                <input
                  name="startsAt"
                  className={inputCls}
                  defaultValue={match.startsAt}
                  placeholder="2026-06-28T19:00:00Z"
                  onChange={handleStartsAtChange}
                />
                <p className="mt-1 text-xs text-pitch-500">
                  Portugal: {match.displayTimePortugal}
                  {deadlinePreview && (
                    <> · <span className="text-amber-400">Deadline apostas: {deadlinePreview}</span></>
                  )}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Estado</label>
                <select name="status" className={selectCls} defaultValue={match.status}>
                  <option value="scheduled">Agendado</option>
                  <option value="live">Em jogo</option>
                  <option value="finished">Terminado</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="bettingOpen"
                  id="bettingOpen"
                  className="h-4 w-4 rounded"
                  defaultChecked={match.bettingOpen}
                />
                <label htmlFor="bettingOpen" className="text-sm text-pitch-200">
                  Apostas abertas
                </label>
              </div>
            </div>
          </Card>

          {/* Odds */}
          <Card title="Odds manuais (opcional)">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">{slotALabel}</label>
                <input name="oddsTeamA" type="number" step="0.01" className={inputCls} defaultValue={match.oddsTeamA ?? ""} placeholder="ex: 2.10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Empate</label>
                <input name="oddsDraw" type="number" step="0.01" className={inputCls} defaultValue={match.oddsDraw ?? ""} placeholder="ex: 3.20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">{slotBLabel}</label>
                <input name="oddsTeamB" type="number" step="0.01" className={inputCls} defaultValue={match.oddsTeamB ?? ""} placeholder="ex: 3.50" />
              </div>
            </div>
          </Card>

          {/* Resultado */}
          <Card title="Resultado (preencher após o jogo)">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Resultado 90 min</label>
                <select name="result90" className={selectCls} defaultValue={match.result90 ?? ""}>
                  <option value="">— Não definido —</option>
                  <option value="teamA">Vitória A ({slotALabel})</option>
                  <option value="draw">Empate</option>
                  <option value="teamB">Vitória B ({slotBLabel})</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Vencedor (ID)</label>
                <input name="winnerTeamId" className={inputCls} defaultValue={match.winnerTeamId ?? ""} placeholder="ID da equipa que passou" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">
                  Golos finais {slotALabel} <span className="font-normal text-pitch-500">(após 120 min)</span>
                </label>
                <input name="scoreFinalTeamA" type="number" min="0" className={inputCls} defaultValue={match.resultFinal?.scoreTeamA ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">
                  Golos finais {slotBLabel}
                </label>
                <input name="scoreFinalTeamB" type="number" min="0" className={inputCls} defaultValue={match.resultFinal?.scoreTeamB ?? ""} />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Guardar alterações</Button>
          </div>
        </form>

        {/* Notificações */}
        <Card title="Notificações">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-pitch-500 mb-1">Agendada para</p>
                <p className="font-medium text-pitch-200">{formatIso(match.notificationScheduledAt)}</p>
              </div>
              <div>
                <p className="text-xs text-pitch-500 mb-1">Estado</p>
                <NotifStatusBadge status={match.notificationStatus} />
              </div>
              {match.notificationSentAt && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-pitch-500 mb-1">Enviada em</p>
                  <p className="text-pitch-200">{formatIso(String(match.notificationSentAt))}</p>
                </div>
              )}
            </div>

            {notifyMsg && (
              <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">
                {notifyMsg}
              </div>
            )}
            {notifyErr && (
              <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
                {notifyErr}
              </div>
            )}

            <div>
              <Button variant="secondary" onClick={handleNotify} disabled={notifying}>
                {notifying ? "A enviar…" : "Enviar lembrete agora"}
              </Button>
              <p className="mt-2 text-xs text-pitch-500">
                Envia notificação push para todos com o link /jogos/{matchId}
              </p>
            </div>
          </div>
        </Card>
      </main>
    </Protected>
  );
}
