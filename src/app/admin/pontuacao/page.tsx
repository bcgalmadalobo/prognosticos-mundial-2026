"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { defaultScoring } from "@/data/defaultScoring";
import { getScoringSettings, saveScoringSettings } from "@/lib/db";
import type { KnockoutRound, ScoringSettings } from "@/types";

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

const KNOCKOUT_ROUNDS: { key: KnockoutRound; label: string }[] = [
  { key: "round_of_32", label: "16-avos (Round of 32)" },
  { key: "round_of_16", label: "Oitavos" },
  { key: "quarter_final", label: "Quartos" },
  { key: "semi_final", label: "Meias" },
  { key: "third_place", label: "3.º/4.º Lugar (M103)" },
  { key: "final", label: "Final" },
];

function deepClone(s: ScoringSettings): ScoringSettings {
  return JSON.parse(JSON.stringify(s)) as ScoringSettings;
}

const numberInputCls =
  "w-20 rounded-xl border border-pitch-500 bg-pitch-900 px-2 py-2 text-right text-sm text-pitch-50 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

export default function PontuacaoPage() {
  const [settings, setSettings] = useState<ScoringSettings>(deepClone(defaultScoring));
  const [busy, setSaveBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getScoringSettings()
      .then((s) => setSettings(deepClone(s)))
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar as definições guardadas. A usar valores padrão.");
      });
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
    round: KnockoutRound,
    field: keyof ScoringSettings["knockout"][KnockoutRound],
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
      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Editor de pontuação</h1>
            <p className="mt-0.5 text-sm text-pitch-300">Ajusta os pontos por categoria e ronda.</p>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-pitch-500 px-3 py-1.5 text-sm font-medium text-pitch-200 transition-colors hover:border-pitch-400 hover:text-pitch-50"
          >
            ← Admin
          </a>
        </div>

        <p className="text-sm text-pitch-300">
          Edita os pontos atribuídos por cada tipo de acerto. Clica em{" "}
          <strong className="text-pitch-100">Guardar pontuação</strong> para persistir. O recálculo
          de{" "}
          <a href="/admin/resultados" className="text-neon-400 underline">
            resultados
          </a>{" "}
          vai usar estes valores.
        </p>

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

        <Card title="Aposta inicial">
          <div className="grid gap-3 md:grid-cols-2">
            {INITIAL_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label className="text-sm text-pitch-100">{label}</label>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={numberInputCls}
                    value={settings.initial[key]}
                    onChange={(e) => setInitial(key, e.target.value)}
                  />
                  <span className="w-6 text-xs font-semibold text-neon-400">pts</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Jogos eliminatórios">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pitch-600 text-left text-xs font-semibold text-pitch-400">
                  <th className="pb-2 pr-4">Ronda</th>
                  <th className="pb-2 pr-4">Mult. odds</th>
                  <th className="pb-2 pr-4">Equipa qualificada</th>
                  <th className="pb-2">Resultado exato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-600">
                {KNOCKOUT_ROUNDS.map(({ key, label }) => {
                  const row = settings.knockout[key];
                  if (!row) return null;
                  return (
                    <tr key={key} className="transition-colors hover:bg-pitch-700/30">
                      <td className="py-3 pr-4 font-medium text-pitch-100">{label}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            className={numberInputCls}
                            value={row.oddsMultiplier}
                            onChange={(e) => setKnockout(key, "oddsMultiplier", e.target.value)}
                          />
                          <span className="text-xs font-semibold text-neon-400">&#215;</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={numberInputCls}
                            value={row.qualifiedTeamPoints}
                            onChange={(e) =>
                              setKnockout(key, "qualifiedTeamPoints", e.target.value)
                            }
                          />
                          <span className="text-xs font-semibold text-neon-400">pts</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={numberInputCls}
                            value={row.scoreExactPoints}
                            onChange={(e) =>
                              setKnockout(key, "scoreExactPoints", e.target.value)
                            }
                          />
                          <span className="text-xs font-semibold text-neon-400">pts</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-pitch-400">
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
            className="rounded-xl border border-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-200 transition-colors hover:border-pitch-400 hover:bg-pitch-700"
          >
            Repor defaults
          </button>
        </div>
      </main>
    </Protected>
  );
}
