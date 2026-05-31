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

// ── Navigation cards ─────────────────────────────────────────────────────────

const NAV_CARDS = [
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
];

// ── Page ─────────────────────────────────────────────────────────────────────

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
        <h1 className="text-2xl font-bold text-pitch-50">Painel Admin</h1>

        {/* Navigation grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="block rounded-2xl border border-pitch-500 bg-pitch-800 p-5 shadow-card transition-all hover:border-neon-500/50 hover:shadow-glow"
            >
              <h2 className="font-bold text-pitch-50">{card.title}</h2>
              <p className="mt-1 text-sm text-pitch-300">{card.description}</p>
            </a>
          ))}
        </div>

        {/* Feedback messages */}
        {message && (
          <p className="rounded-xl bg-green-50 p-3 text-green-900">{message}</p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>
        )}

        {/* Secondary tools */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-pitch-300">
            Ferramentas
          </h2>
          <div className="space-y-4">
            <Card title="Criar equipa">
              <form onSubmit={addTeam} className="grid gap-3 md:grid-cols-4">
                <input
                  name="id"
                  className="rounded-xl border p-3"
                  placeholder="id ex portugal"
                  required
                />
                <input
                  name="name"
                  className="rounded-xl border p-3"
                  placeholder="Nome"
                  required
                />
                <input
                  name="group"
                  className="rounded-xl border p-3"
                  placeholder="Grupo"
                />
                <Button>Guardar</Button>
              </form>
            </Card>

            <Card title="Criar/editar jogo">
              <form onSubmit={addMatch} className="grid gap-3 md:grid-cols-3">
                <input
                  name="id"
                  className="rounded-xl border p-3"
                  placeholder="id ex teste_01"
                  required
                />
                <select name="round" className="rounded-xl border p-3">
                  <option value="round_of_32">Round of 32 / 16-avos</option>
                  <option value="round_of_16">Oitavos</option>
                  <option value="quarter_final">Quartos</option>
                  <option value="semi_final">Meia-final</option>
                  <option value="final">Final</option>
                </select>
                <select name="status" className="rounded-xl border p-3">
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                  <option value="finished">Finished</option>
                </select>
                <input
                  name="homeTeam"
                  className="rounded-xl border p-3"
                  placeholder="Casa ex portugal"
                  required
                />
                <input
                  name="awayTeam"
                  className="rounded-xl border p-3"
                  placeholder="Fora ex espanha"
                  required
                />
                <input
                  name="oddHome"
                  className="rounded-xl border p-3"
                  placeholder="Odd casa"
                  type="number"
                  step="0.01"
                  required
                />
                <input
                  name="oddDraw"
                  className="rounded-xl border p-3"
                  placeholder="Odd empate"
                  type="number"
                  step="0.01"
                  required
                />
                <input
                  name="oddAway"
                  className="rounded-xl border p-3"
                  placeholder="Odd fora"
                  type="number"
                  step="0.01"
                  required
                />
                <Button>Guardar jogo</Button>
              </form>
            </Card>

            <Card title="Inserir resultado">
              <form onSubmit={addResult} className="grid gap-3 md:grid-cols-4">
                <select name="matchId" className="rounded-xl border p-3" required>
                  <option value="">Escolher jogo</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.id}: {match.homeTeam} vs {match.awayTeam} [{match.status}]
                    </option>
                  ))}
                </select>
                <input
                  name="result90"
                  className="rounded-xl border p-3"
                  placeholder="Resultado 90 min ex 1-0"
                  required
                />
                <input
                  name="result120"
                  className="rounded-xl border p-3"
                  placeholder="Resultado 120 min, opcional"
                />
                <input
                  name="qualifiedTeam"
                  className="rounded-xl border p-3"
                  placeholder="Passou ex portugal"
                  required
                />
                <Button>Guardar resultado</Button>
              </form>
              <p className="mt-3 text-sm text-pitch-200">
                Nos oitavos e 16-avos, podes deixar o resultado 120 min vazio. Nos quartos, meias e final,
                preenche se quiseres pontuar resultado exato após prolongamento.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </Protected>
  );
}
