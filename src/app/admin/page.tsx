"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import {
  listMatches,
  saveMatch,
  saveMatchResult,
  saveTeam,
} from "@/lib/db";
import type { Match, MatchRound, MatchStatus, ScoreLine } from "@/types";

const NAV_CARDS = [
  {
    title: "Jogos eliminatórios",
    description: "Gerir jogos M73–M104, odds, apostas e notificações.",
    href: "/admin/jogos",
  },
  {
    title: "Convites e participantes",
    description: "Gerar códigos de acesso e gerir utilizadores pendentes.",
    href: "/admin/convites",
  },
  {
    title: "Resultados da aposta inicial",
    description: "Inserir resultados reais do torneio e recalcular pontos.",
    href: "/admin/resultados",
  },
  {
    title: "Editor de pontuação",
    description: "Ajustar os valores de pontuação por categoria e ronda.",
    href: "/admin/pontuacao",
  },
  {
    title: "Classificação",
    description: "Ver a tabela classificativa dos participantes.",
    href: "/classificacao",
  },
  {
    title: "Aposta inicial",
    description: "Consultar o simulador do torneio e a aposta inicial.",
    href: "/aposta-inicial",
  },
  {
    title: "Configurações",
    description: "Editar nome da competição, deadline e estado da aposta.",
    href: "/admin/configuracoes",
  },
  {
    title: "Notificações",
    description: "Enviar notificações push para todos os participantes.",
    href: "/admin/notificacoes",
  },
];

const inputCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

const selectCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

export default function AdminPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    refreshMatches();
  }, []);

  async function refreshMatches() {
    const rows = await listMatches();
    setMatches(rows);
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function parseScore(value: FormDataEntryValue | null): ScoreLine | null {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const parts = raw.split("-").map((x) => Number(x.trim()));
    if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
    return { homeGoals: parts[0], awayGoals: parts[1] };
  }

  async function addTeam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    clearMessages();
    try {
      await saveTeam({
        id: String(f.get("id") || "").trim(),
        name: String(f.get("name") || "").trim(),
        group: String(f.get("group") || "").trim(),
      });
      setMessage("Equipa guardada.");
      form.reset();
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar equipa. Confirma se és admin e se as regras do Firestore foram publicadas.");
    }
  }

  async function addMatch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    clearMessages();
    try {
      await saveMatch({
        id: String(f.get("id") || "").trim(),
        round: f.get("round") as MatchRound,
        homeTeam: String(f.get("homeTeam") || "").trim(),
        awayTeam: String(f.get("awayTeam") || "").trim(),
        status: f.get("status") as MatchStatus,
        odds: {
          home: Number(f.get("oddHome")),
          draw: Number(f.get("oddDraw")),
          away: Number(f.get("oddAway")),
        },
      });
      setMessage("Jogo guardado.");
      form.reset();
      await refreshMatches();
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar jogo. Confirma se és admin e se as regras do Firestore foram publicadas.");
    }
  }

  async function addResult(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    clearMessages();

    const matchId = String(f.get("matchId") || "").trim();
    const result90 = parseScore(f.get("result90"));
    const result120 = parseScore(f.get("result120"));
    const qualifiedTeam = String(f.get("qualifiedTeam") || "").trim();

    if (!matchId) { setError("Escolhe um jogo."); return; }
    if (!result90) { setError("Escreve o resultado aos 90 minutos no formato 1-0."); return; }
    if (!qualifiedTeam) { setError("Escreve a equipa que passou. Exemplo: portugal"); return; }

    try {
      const updates: Partial<Match> = { status: "finished", result90, qualifiedTeam };
      if (result120) updates.result120 = result120;
      await saveMatchResult(matchId, updates);
      setMessage("Resultado guardado e jogo marcado como terminado.");
      form.reset();
      await refreshMatches();
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar resultado.");
    }
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-4xl space-y-8 p-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-pitch-50">Painel Admin</h1>
          <p className="mt-1 text-sm text-pitch-300">Painel de controlo da competição.</p>
        </div>

        {/* Navigation grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="group block rounded-2xl border border-pitch-500 bg-pitch-800 p-5 shadow-card transition-all hover:border-neon-500/60 hover:bg-pitch-700/50 hover:shadow-glow"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-pitch-50 transition-colors group-hover:text-neon-400">
                  {card.title}
                </h2>
                <span className="ml-2 shrink-0 text-pitch-400 transition-colors group-hover:text-neon-400">
                  →
                </span>
              </div>
              <p className="mt-1 text-sm text-pitch-300">{card.description}</p>
            </a>
          ))}
        </div>

        {/* Feedback messages */}
        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-900/30 p-3 text-sm text-green-400">
            <span className="mt-0.5 shrink-0">&#10003;</span>
            <p>{message}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            <span className="mt-0.5 shrink-0">&#10005;</span>
            <p>{error}</p>
          </div>
        )}

        {/* Secondary tools */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pitch-400">
              Ferramentas
            </h2>
            <div className="h-px flex-1 bg-pitch-600" />
          </div>
          <div className="space-y-4">
            <Card title="Criar equipa">
              <form onSubmit={addTeam} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">ID</label>
                  <input name="id" className={inputCls} placeholder="ex: portugal" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Nome</label>
                  <input name="name" className={inputCls} placeholder="Portugal" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Grupo</label>
                  <input name="group" className={inputCls} placeholder="ex: A" />
                </div>
                <div className="flex items-end">
                  <Button className="w-full">Guardar</Button>
                </div>
              </form>
            </Card>

            <Card title="Criar/editar jogo">
              <form onSubmit={addMatch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">ID do jogo</label>
                  <input name="id" className={inputCls} placeholder="ex: jogo_01" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Ronda</label>
                  <select name="round" className={selectCls}>
                    <option value="round_of_32">Round of 32 / 16-avos</option>
                    <option value="round_of_16">Oitavos</option>
                    <option value="quarter_final">Quartos</option>
                    <option value="semi_final">Meia-final</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Estado</label>
                  <select name="status" className={selectCls}>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="locked">Locked</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Casa</label>
                  <input name="homeTeam" className={inputCls} placeholder="ex: portugal" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Fora</label>
                  <input name="awayTeam" className={inputCls} placeholder="ex: espanha" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd casa</label>
                  <input
                    name="oddHome"
                    className={inputCls}
                    placeholder="ex: 2.10"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd empate</label>
                  <input
                    name="oddDraw"
                    className={inputCls}
                    placeholder="ex: 3.20"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Odd fora</label>
                  <input
                    name="oddAway"
                    className={inputCls}
                    placeholder="ex: 3.50"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button className="w-full">Guardar jogo</Button>
                </div>
              </form>
            </Card>

            <Card title="Inserir resultado">
              <form onSubmit={addResult} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">Jogo</label>
                  <select name="matchId" className={selectCls} required>
                    <option value="">Escolher jogo</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {match.id}: {match.homeTeam} vs {match.awayTeam} [{match.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">
                    Resultado 90 min
                  </label>
                  <input name="result90" className={inputCls} placeholder="ex: 1-0" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">
                    Resultado 120 min{" "}
                    <span className="font-normal text-pitch-400">(opcional)</span>
                  </label>
                  <input name="result120" className={inputCls} placeholder="ex: 1-1" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">
                    Equipa qualificada
                  </label>
                  <input name="qualifiedTeam" className={inputCls} placeholder="ex: portugal" required />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <Button>Guardar resultado</Button>
                </div>
              </form>
              <p className="mt-3 text-sm text-pitch-300">
                Nos oitavos e 16-avos, podes deixar o resultado 120 min vazio. Nos quartos, meias e
                final, preenche se quiseres pontuar resultado exato após prolongamento.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </Protected>
  );
}
