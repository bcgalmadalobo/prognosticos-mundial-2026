"use client";

import { FormEvent, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { getKnockoutMatch, updateKnockoutMatch } from "@/lib/db";
import { ROUND_LABELS, notificationTime } from "@/lib/matchPredictionValidation";
import type { KnockoutMatch, KnockoutMatchStatus, KnockoutResult90 } from "@/types";

const inputCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";
const selectCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

interface PageProps { params: Promise<{ matchId: string }> }

export default function AdminMatchEditPage({ params }: PageProps) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<KnockoutMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyErr, setNotifyErr] = useState("");
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    getKnockoutMatch(matchId)
      .then(setMatch)
      .finally(() => setLoading(false));
  }, [matchId]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const f = new FormData(e.currentTarget);
    const startsAt = String(f.get("startsAt") ?? "").trim();

    const updates: Partial<KnockoutMatch> = {
      teamA: String(f.get("teamA") ?? "").trim() || null,
      teamB: String(f.get("teamB") ?? "").trim() || null,
      teamAName: String(f.get("teamAName") ?? "").trim() || undefined,
      teamBName: String(f.get("teamBName") ?? "").trim() || undefined,
      bettingOpen: f.get("bettingOpen") === "on",
      status: f.get("status") as KnockoutMatchStatus,
      oddsTeamA: f.get("oddsTeamA") ? Number(f.get("oddsTeamA")) : undefined,
      oddsDraw: f.get("oddsDraw") ? Number(f.get("oddsDraw")) : undefined,
      oddsTeamB: f.get("oddsTeamB") ? Number(f.get("oddsTeamB")) : undefined,
      winnerTeamId: String(f.get("winnerTeamId") ?? "").trim() || undefined,
    };

    if (startsAt) {
      updates.startsAt = startsAt;
      updates.notificationScheduledAt = notificationTime(startsAt);
    }

    const r90 = String(f.get("result90") ?? "").trim();
    if (r90) updates.result90 = r90 as KnockoutResult90;

    const sA = f.get("scoreFinalTeamA");
    const sB = f.get("scoreFinalTeamB");
    if (sA !== null && sA !== "" && sB !== null && sB !== "") {
      updates.resultFinal = { scoreTeamA: Number(sA), scoreTeamB: Number(sB) };
    }

    try {
      await updateKnockoutMatch(matchId, updates);
      setMsg("Guardado.");
      const refreshed = await getKnockoutMatch(matchId);
      setMatch(refreshed);
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
      const refreshed = await getKnockoutMatch(matchId);
      setMatch(refreshed);
    } catch (e) {
      setNotifyErr(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setNotifying(false);
    }
  }

  if (loading) return <Protected adminOnly><main className="p-4 text-pitch-400">A carregar…</main></Protected>;
  if (!match) return <Protected adminOnly><main className="p-4 text-pitch-400">Jogo não encontrado.</main></Protected>;

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/jogos" className="text-sm text-pitch-400 hover:text-neon-400">← Jogos</Link>
          <span className="text-pitch-600">/</span>
          <h1 className="text-xl font-bold text-pitch-50">{match.id}</h1>
          <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-pitch-300">
            {ROUND_LABELS[match.round]}
          </span>
        </div>

        <div className="rounded-xl border border-pitch-600 bg-pitch-800/50 p-3 text-xs text-pitch-400 space-y-0.5">
          <p><span className="text-pitch-300">Slots:</span> {match.slotA} vs {match.slotB}</p>
          <p><span className="text-pitch-300">Venue:</span> {match.venue}, {match.city}, {match.country}</p>
          <p><span className="text-pitch-300">Hora UTC:</span> {match.startsAt}</p>
          <p><span className="text-pitch-300">Portugal:</span> {match.displayTimePortugal}</p>
          <p><span className="text-pitch-300">Fonte:</span> {match.sourceNote}</p>
        </div>

        {msg && <div className="rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">{msg}</div>}
        {err && <div className="rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">{err}</div>}

        <form onSubmit={handleSave} className="space-y-4">
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

          <Card title="Calendário e estado">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">
                  startsAt UTC (ISO 8601)
                </label>
                <input
                  name="startsAt"
                  className={inputCls}
                  defaultValue={match.startsAt}
                  placeholder="2026-06-28T19:00:00Z"
                />
                <p className="mt-1 text-xs text-pitch-500">Altera só se a FIFA mudar a hora. Portugal: {match.displayTimePortugal}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Estado</label>
                <select name="status" className={selectCls} defaultValue={match.status}>
                  <option value="scheduled">Agendado</option>
                  <option value="live">Em jogo</option>
                  <option value="finished">Terminado</option>
                </select>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  name="bettingOpen"
                  id="bettingOpen"
                  className="h-4 w-4 rounded"
                  defaultChecked={match.bettingOpen}
                />
                <label htmlFor="bettingOpen" className="text-sm text-pitch-200">
                  Apostas abertas (bettingOpen)
                </label>
              </div>
            </div>
          </Card>

          <Card title="Odds manuais (opcional)">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd A</label>
                <input name="oddsTeamA" type="number" step="0.01" className={inputCls} defaultValue={match.oddsTeamA ?? ""} placeholder="ex: 2.10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd Empate</label>
                <input name="oddsDraw" type="number" step="0.01" className={inputCls} defaultValue={match.oddsDraw ?? ""} placeholder="ex: 3.20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd B</label>
                <input name="oddsTeamB" type="number" step="0.01" className={inputCls} defaultValue={match.oddsTeamB ?? ""} placeholder="ex: 3.50" />
              </div>
            </div>
          </Card>

          <Card title="Resultado (preencher após o jogo)">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Resultado 90 min</label>
                <select name="result90" className={selectCls} defaultValue={match.result90 ?? ""}>
                  <option value="">— Não definido —</option>
                  <option value="teamA">Vitória A</option>
                  <option value="draw">Empate</option>
                  <option value="teamB">Vitória B</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Vencedor (ID)</label>
                <input name="winnerTeamId" className={inputCls} defaultValue={match.winnerTeamId ?? ""} placeholder="ID da equipa que passou" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">
                  Golos finais A <span className="font-normal text-pitch-500">(após 120 min se necessário)</span>
                </label>
                <input name="scoreFinalTeamA" type="number" min="0" className={inputCls} defaultValue={match.resultFinal?.scoreTeamA ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-pitch-300">Golos finais B</label>
                <input name="scoreFinalTeamB" type="number" min="0" className={inputCls} defaultValue={match.resultFinal?.scoreTeamB ?? ""} />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Guardar alterações</Button>
          </div>
        </form>

        <Card title="Notificação">
          <div className="space-y-3">
            <div className="text-xs text-pitch-400 space-y-0.5">
              <p><span className="text-pitch-300">Agendada para:</span> {match.notificationScheduledAt ?? "—"}</p>
              <p>
                <span className="text-pitch-300">Estado:</span>{" "}
                <span className={
                  match.notificationStatus === "sent" ? "text-green-400" :
                  match.notificationStatus === "failed" ? "text-red-400" : "text-pitch-400"
                }>
                  {match.notificationStatus ?? "pendente"}
                </span>
              </p>
              {match.notificationSentAt && (
                <p><span className="text-pitch-300">Enviada em:</span> {String(match.notificationSentAt)}</p>
              )}
            </div>
            {notifyMsg && <p className="text-sm text-green-400">{notifyMsg}</p>}
            {notifyErr && <p className="text-sm text-red-400">{notifyErr}</p>}
            <Button
              variant="secondary"
              onClick={handleNotify}
              disabled={notifying}
            >
              {notifying ? "A enviar…" : "Enviar lembrete agora"}
            </Button>
            <p className="text-xs text-pitch-500">
              Envia notificação push para todos com o link /jogos/{matchId}
            </p>
          </div>
        </Card>
      </main>
    </Protected>
  );
}
