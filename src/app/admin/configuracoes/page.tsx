"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { getAppSettings, saveAppSettings } from "@/lib/db";

const DEFAULT_DEADLINE = "2026-06-11T18:00:00.000Z";

function isValidIsoDate(str: string): boolean {
  if (!str.trim()) return false;
  const d = new Date(str.trim());
  return !isNaN(d.getTime());
}

export default function ConfiguracoesPage() {
  const [competitionName, setCompetitionName] = useState("Prognósticos Mundial 2026");
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [predictionStatus, setPredictionStatus] = useState<"open" | "closed">("open");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAppSettings()
      .then((settings) => {
        if (!settings) return;
        if (settings.competitionName !== undefined) setCompetitionName(settings.competitionName);
        if (settings.initialPredictionDeadline) setDeadline(settings.initialPredictionDeadline);
        if (settings.welcomeMessage !== undefined) setWelcomeMessage(settings.welcomeMessage);
        if (settings.initialPredictionStatus) setPredictionStatus(settings.initialPredictionStatus);
      })
      .catch(() => {
        // silently use defaults
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!isValidIsoDate(deadline)) {
      setError("Deadline inválida. Usa o formato ISO UTC, ex: 2026-06-11T18:00:00.000Z");
      return;
    }

    setSaving(true);
    try {
      await saveAppSettings({
        competitionName: competitionName.trim(),
        initialPredictionDeadline: deadline.trim(),
        welcomeMessage: welcomeMessage.trim(),
        initialPredictionStatus: predictionStatus,
      });
      setMessage("Configurações guardadas com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar. Confirma se tens permissões de admin e as regras do Firestore estão publicadas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pitch-50">Configurações</h1>
          <a href="/admin" className="text-sm text-neon-400">
            ← Admin
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-pitch-300">A carregar...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <p className="rounded-xl bg-green-50 p-3 text-sm text-green-900">{message}</p>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">{error}</p>
            )}

            <Card title="Nome da competição">
              <input
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="Ex: Prognósticos Mundial 2026"
                maxLength={120}
                className="w-full rounded-xl border border-pitch-500 px-3 py-2.5 text-sm focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
              />
            </Card>

            <Card title="Estado da aposta inicial">
              <div className="space-y-2">
                <select
                  value={predictionStatus}
                  onChange={(e) => setPredictionStatus(e.target.value as "open" | "closed")}
                  className="w-full rounded-xl border border-pitch-500 px-3 py-2.5 text-sm focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
                >
                  <option value="open">Aberta — deadline controla o prazo</option>
                  <option value="closed">Fechada — bloqueia submissões imediatamente</option>
                </select>
                <p className="text-xs text-pitch-300">
                  "Fechada" sobrepõe-se à deadline: rejeita todas as submissões independentemente da data.
                </p>
              </div>
            </Card>

            <Card title="Deadline da aposta inicial">
              <div className="space-y-2">
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="2026-06-11T18:00:00.000Z"
                  className="w-full rounded-xl border border-pitch-500 px-3 py-2.5 font-mono text-sm focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
                />
                <p className="text-xs text-pitch-300">
                  Formato ISO UTC. Portugal continental (verão, UTC+1):{" "}
                  <code className="rounded bg-pitch-700 px-1">2026-06-11T18:00:00.000Z</code>{" "}
                  corresponde a 11/06/2026 às 19:00.
                </p>
                {deadline && isValidIsoDate(deadline) && (
                  <p className="text-xs text-pitch-300">
                    Data reconhecida:{" "}
                    {new Date(deadline).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Lisbon",
                    })}{" "}
                    (hora de Lisboa)
                  </p>
                )}
              </div>
            </Card>

            <Card title="Mensagem de boas-vindas">
              <div className="space-y-2">
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Mensagem opcional mostrada aos participantes no dashboard."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-pitch-500 px-3 py-2.5 text-sm focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
                />
                <p className="text-right text-xs text-pitch-300">
                  {welcomeMessage.length}/500
                </p>
              </div>
            </Card>

            <Button disabled={saving} className="w-full py-3">
              {saving ? "A guardar..." : "Guardar configurações"}
            </Button>
          </form>
        )}
      </main>
    </Protected>
  );
}
