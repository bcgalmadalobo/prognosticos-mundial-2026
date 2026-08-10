"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { getTournamentResults } from "@/lib/db";
import type { TournamentResults } from "@/types";

const GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeList(arr?: string[]): string {
  return (arr ?? []).join(", ");
}

const inputCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

export default function ResultadosPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcResult, setRecalcResult] = useState<number | null>(null);

  const [groups, setGroups] = useState<Record<string, string>>(
    Object.fromEntries(GROUP_IDS.map((g) => [g, ""]))
  );
  const [roundOf32, setRoundOf32] = useState("");
  const [roundOf16, setRoundOf16] = useState("");
  const [quarterFinal, setQuarterFinal] = useState("");
  const [semiFinal, setSemiFinal] = useState("");
  const [finalTeams, setFinalTeams] = useState("");
  const [winner, setWinner] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [fourthPlace, setFourthPlace] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [bestYoungPlayer, setBestYoungPlayer] = useState("");
  const [bestGoalkeeper, setBestGoalkeeper] = useState("");

  useEffect(() => {
    getTournamentResults()
      .then((results) => {
        if (!results) return;
        if (results.groupPositions) {
          setGroups(
            Object.fromEntries(
              GROUP_IDS.map((g) => [g, serializeList(results.groupPositions?.[g])])
            )
          );
        }
        setRoundOf32(serializeList(results.roundOf32Teams));
        setRoundOf16(serializeList(results.roundOf16Teams));
        setQuarterFinal(serializeList(results.quarterFinalTeams));
        setSemiFinal(serializeList(results.semiFinalTeams));
        setFinalTeams(serializeList(results.finalTeams));
        setWinner(results.winner ?? "");
        setRunnerUp(results.runnerUp ?? "");
        setThirdPlace(results.thirdPlace ?? "");
        setFourthPlace(results.fourthPlace ?? "");
        setTopScorer(results.topScorer ?? "");
        setBestPlayer(results.bestPlayer ?? "");
        setBestYoungPlayer(results.bestYoungPlayer ?? "");
        setBestGoalkeeper(results.bestGoalkeeper ?? "");
      })
      .catch(console.error);
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveBusy(true);
    setMessage("");
    setError("");
    setRecalcResult(null);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Não autenticado. Faz login novamente.");
      setSaveBusy(false);
      return;
    }

    const groupPositions: Record<string, string[]> = {};
    for (const g of GROUP_IDS) {
      const parsed = parseList(groups[g]);
      if (parsed.length > 0) groupPositions[g] = parsed;
    }

    const results: TournamentResults = {
      groupPositions,
      roundOf32Teams: parseList(roundOf32),
      roundOf16Teams: parseList(roundOf16),
      quarterFinalTeams: parseList(quarterFinal),
      semiFinalTeams: parseList(semiFinal),
      finalTeams: parseList(finalTeams),
      winner: winner.trim() || undefined,
      runnerUp: runnerUp.trim() || undefined,
      thirdPlace: thirdPlace.trim() || undefined,
      fourthPlace: fourthPlace.trim() || undefined,
      topScorer: topScorer.trim() || undefined,
      bestPlayer: bestPlayer.trim() || undefined,
      bestYoungPlayer: bestYoungPlayer.trim() || undefined,
      bestGoalkeeper: bestGoalkeeper.trim() || undefined,
    };

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/tournament-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(results),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        console.error("[resultados] API error", {
          status: res.status,
          error: data.error,
          uid: currentUser.uid,
          email: currentUser.email,
          payload: results,
        });
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setMessage("Resultados guardados com sucesso.");
    } catch (err) {
      const code = (err as { code?: string }).code;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[resultados] Erro ao guardar:", {
        code,
        message,
        path: "tournamentResults/main",
        uid: currentUser.uid,
        email: currentUser.email,
        payload: results,
      });
      setError(`Erro ao guardar resultados: ${message}`);
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleRecalculate() {
    setRecalcBusy(true);
    setMessage("");
    setError("");
    setRecalcResult(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Não autenticado.");

      const token = await currentUser.getIdToken();

      const res = await fetch("/api/recalculate-initial-points", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = (await res.json()) as { success?: boolean; updated?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido.");

      setRecalcResult(data.updated ?? 0);
      setMessage(`Pontos recalculados para ${data.updated} apostas iniciais.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao recalcular pontos.");
    } finally {
      setRecalcBusy(false);
    }
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Resultados do torneio</h1>
            <p className="mt-0.5 text-sm text-pitch-300">Preenche à medida que o torneio avança.</p>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-pitch-500 px-3 py-1.5 text-sm font-medium text-pitch-200 transition-colors hover:border-pitch-400 hover:text-pitch-50"
          >
            ← Admin
          </a>
        </div>

        <p className="text-sm text-pitch-300">
          Campos vazios não pontuam. Os ids das equipas devem coincidir com os usados nas apostas
          (ex:{" "}
          <code className="rounded bg-pitch-700 px-1 text-pitch-100">portugal</code>).
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

        <form onSubmit={handleSave} className="space-y-4">
          <Card title="Posições finais dos grupos">
            <p className="mb-3 text-xs text-pitch-400">
              1.º ao 4.º, separados por vírgula (ex: portugal, espanha, brasil, argentina)
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {GROUP_IDS.map((g) => (
                <div key={g}>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">
                    Grupo {g}
                  </label>
                  <input
                    className={inputCls}
                    placeholder="1.º, 2.º, 3.º, 4.º"
                    value={groups[g]}
                    onChange={(e) => setGroups({ ...groups, [g]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Equipas apuradas por ronda">
            <p className="mb-3 text-xs text-pitch-400">IDs das equipas separados por vírgula</p>
            <div className="space-y-3">
              {(
                [
                  { label: "32 apurados (16-avos)", value: roundOf32, set: setRoundOf32 },
                  { label: "16 apurados (oitavos)", value: roundOf16, set: setRoundOf16 },
                  { label: "8 apurados (quartos)", value: quarterFinal, set: setQuarterFinal },
                  { label: "4 apurados (meias)", value: semiFinal, set: setSemiFinal },
                  { label: "2 finalistas", value: finalTeams, set: setFinalTeams },
                ] as { label: string; value: string; set: (v: string) => void }[]
              ).map(({ label, value, set }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">{label}</label>
                  <input
                    className={inputCls}
                    placeholder="ex: portugal, espanha, brasil, ..."
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Classificação final">
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  { label: "Vencedor", value: winner, set: setWinner },
                  { label: "Finalista (2.º lugar)", value: runnerUp, set: setRunnerUp },
                  { label: "3.º lugar", value: thirdPlace, set: setThirdPlace },
                  { label: "4.º lugar", value: fourthPlace, set: setFourthPlace },
                ] as { label: string; value: string; set: (v: string) => void }[]
              ).map(({ label, value, set }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">{label}</label>
                  <input
                    className={inputCls}
                    placeholder="id da equipa"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Prémios individuais">
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  { label: "Melhor marcador", value: topScorer, set: setTopScorer },
                  { label: "Melhor jogador", value: bestPlayer, set: setBestPlayer },
                  { label: "Melhor jovem", value: bestYoungPlayer, set: setBestYoungPlayer },
                  { label: "Melhor guarda-redes", value: bestGoalkeeper, set: setBestGoalkeeper },
                ] as { label: string; value: string; set: (v: string) => void }[]
              ).map(({ label, value, set }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-semibold text-pitch-300">{label}</label>
                  <input
                    className={inputCls}
                    placeholder="nome do jogador"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Button disabled={saveBusy}>{saveBusy ? "A guardar..." : "Guardar resultados"}</Button>
        </form>

        <Card title="Calcular pontos da aposta inicial" accent="brand">
          <p className="mb-3 text-sm text-pitch-200">
            Guarda os resultados acima primeiro. Depois clica aqui para recalcular os pontos de
            todas as apostas iniciais submetidas. Os knockoutPoints existentes são preservados.
          </p>
          {recalcResult !== null && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-900/30 px-3 py-1 text-sm font-semibold text-green-400">
              <span>&#10003;</span>
              <span>{recalcResult} apostas atualizadas</span>
            </div>
          )}
          <div>
            <Button type="button" onClick={handleRecalculate} disabled={recalcBusy}>
              {recalcBusy ? "A calcular..." : "Recalcular initialPoints"}
            </Button>
          </div>
        </Card>
      </main>
    </Protected>
  );
}
