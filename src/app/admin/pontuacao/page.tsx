"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { defaultScoring } from "@/data/defaultScoring";
import { getScoringSettings, saveScoringSettings } from "@/lib/db";
import type { MatchRound, ScoringSettings } from "@/types";

const INITIAL_FIELDS: { key: keyof ScoringSettings["initial"]; label: string }[] = [
  { key: "winner",           label: "Vencedor" },
  { key: "runnerUp",         label: "Finalista (2.º lugar)" },
  { key: "thirdPlace",       label: "3.º lugar" },
  { key: "fourthPlace",      label: "4.º lugar" },
  { key: "topScorer",        label: "Melhor marcador" },
  { key: "bestPlayer",       label: "Melhor jogador" },
  { key: "bestYoungPlayer",  label: "Melhor jovem" },
  { key: "bestGoalkeeper",   label: "Melhor guarda-redes" },
  { key: "finalTeam",        label: "Equipa na final (por equipa)" },
  { key: "semiFinalTeam",    label: "Equipa na meia-final (por equipa)" },
  { key: "quarterFinalTeam", label: "Equipa nos quartos (por equipa)" },
  { key: "roundOf16Team",    label: "Equipa nos oitavos (por equipa)" },
  { key: "roundOf32Team",    label: "Equipa nos 16-avos (por equipa)" },
  { key: "groupPosition",    label: "Posição correta no grupo (por posição)" },
];

const KNOCKOUT_ROUNDS: { key: MatchRound; label: string }[] = [
  { key: "round_of_32", label: "16-avos (Round of 32)" },
  { key: "round_of_16", label: "Oitavos" },
  { key: "quarter_final", label: "Quartos" },
  { key: "semi_final", label: "Meias" },
  { key: "final", label: "Final" },
];

function deepClone(s: ScoringSettings): ScoringSettings {
  return JSON.parse(JSON.stringify(s)) as ScoringSettings;
}

export default function PontuacaoPage() {
  const [settings, setSettings] = useState<ScoringSettings>(deepClone(defaultScoring));
  const [busy, setSaveBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getScoringSettings()
      .then((s) => setSettings(deepClone(s)))
      .catch(console.error);
  }, []);

  function setInitial(key: keyof ScoringSettings["initial"], raw: string) {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    setSettings((prev) => ({
      ...prev,
      initial: { ...prev.initial, [key]: value },
    }));
  }

  function setKnockout(
    round: MatchRound,
    field: keyof ScoringSettings["knockout"][MatchRound],
    raw: string
  ) {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    setSettings((prev) => ({
      ...prev,
      knockout: {
        ...prev.knockout,
        [round]: { ...prev.knockout[round], [field]: value },
      },
    }));
  }

  async function handleSave() {
    setSaveBusy(true);
    setMessage("");
    setError("");
    try {
      await saveScoringSettings(settings);
      setMessage("Pontuação guardada. O próximo recálculo irá usar estes valores.");
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar. Confirma as regras do Firestore.");
    } finally {
      setSaveBusy(false);
    }
  }

  function handleReset() {
    setSettings(deepClone(defaultScoring));
    setMessage("");
    setError("");
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editor de pontuação</h1>
          <a href="/admin" className="text-sm text-neon-400">← Admin</a>
        </div>

        <p className="text-sm text-pitch-300">
          Edita os pontos atribuídos por cada tipo de acerto. Clica em{" "}
          <strong>Guardar pontuação</strong> para persistir. O recálculo de{" "}
          <a href="/admin/resultados" className="underline">resultados</a> vai usar estes valores.
        </p>

        {message && <p className="rounded-xl bg-green-50 p-3 text-green-900">{message}</p>}
        {error   && <p className="rounded-xl bg-red-50   p-3 text-red-900">{error}</p>}

        <Card title="Aposta inicial">
          <div className="grid gap-3 md:grid-cols-2">
            {INITIAL_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-pitch-200">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-24 rounded-xl border p-2 text-right text-sm"
                    value={settings.initial[key]}
                    onChange={(e) => setInitial(key, e.target.value)}
                  />
                  <span className="text-xs text-pitch-300">pts</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Jogos eliminatórios">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pitch-500 text-left text-xs font-semibold text-pitch-300">
                  <th className="pb-2 pr-4">Ronda</th>
                  <th className="pb-2 pr-4">Mult. odds</th>
                  <th className="pb-2 pr-4">Equipa qualificada (pts)</th>
                  <th className="pb-2">Resultado exato (pts)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {KNOCKOUT_ROUNDS.map(({ key, label }) => {
                  const row = settings.knockout[key];
                  return (
                    <tr key={key} className="py-2">
                      <td className="py-3 pr-4 font-medium">{label}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className="w-20 rounded-xl border p-2 text-right text-sm"
                          value={row.oddsMultiplier}
                          onChange={(e) => setKnockout(key, "oddsMultiplier", e.target.value)}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="w-20 rounded-xl border p-2 text-right text-sm"
                          value={row.qualifiedTeamPoints}
                          onChange={(e) => setKnockout(key, "qualifiedTeamPoints", e.target.value)}
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="w-20 rounded-xl border p-2 text-right text-sm"
                          value={row.scoreExactPoints}
                          onChange={(e) => setKnockout(key, "scoreExactPoints", e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-pitch-300">
            Mult. odds: pontos = odd × multiplicador (ex: odd 2.1 × mult 2 = 4.2 pts).
            Resultado exato aplica-se apenas a partir dos quartos.
          </p>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "A guardar..." : "Guardar pontuação"}
          </Button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-200 hover:bg-pitch-700"
          >
            Repor defaults
          </button>
        </div>
      </main>
    </Protected>
  );
}
