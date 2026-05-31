"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";
import { getTournamentResults, saveTournamentResults } from "@/lib/db";
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

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Não autenticado.");

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
        updatedBy: currentUser.uid,
      };

      await saveTournamentResults(results);
      setMessage("Resultados guardados com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar resultados. Confirma se és admin e se as regras do Firestore foram publicadas.");
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
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resultados reais do torneio</h1>
          <a href="/admin" className="text-sm text-brand-700">
            ← Admin
          </a>
        </div>

        <p className="text-sm text-slate-500">
          Preenche os campos à medida que o torneio avança. Campos vazios não pontuam.
          Os ids das equipas devem coincidir com os usados nas apostas (ex: <code>portugal</code>).
        </p>

        {message && <p className="rounded-xl bg-green-50 p-3 text-green-900">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>}

        <form onSubmit={handleSave} className="space-y-4">
          <Card title="Posições finais dos grupos (1.º ao 4.º, separados por vírgula)">
            <div className="grid gap-3 md:grid-cols-3">
              {GROUP_IDS.map((g) => (
                <div key={g}>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Grupo {g}
                  </label>
                  <input
                    className="w-full rounded-xl border p-2 text-sm"
                    placeholder="1.º, 2.º, 3.º, 4.º"
                    value={groups[g]}
                    onChange={(e) => setGroups({ ...groups, [g]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Equipas apuradas por ronda (ids separados por vírgula)">
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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                  <input
                    className="w-full rounded-xl border p-2 text-sm"
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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                  <input
                    className="w-full rounded-xl border p-3"
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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
                  <input
                    className="w-full rounded-xl border p-3"
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

        <Card title="Calcular pontos da aposta inicial">
          <p className="mb-3 text-sm text-slate-600">
            Guarda os resultados acima primeiro. Depois clica aqui para recalcular os pontos de todas
            as apostas iniciais submetidas. Os knockoutPoints existentes são preservados.
          </p>
          {recalcResult !== null && (
            <p className="mb-3 text-sm font-semibold text-green-700">
              {recalcResult} apostas atualizadas.
            </p>
          )}
          <Button type="button" onClick={handleRecalculate} disabled={recalcBusy}>
            {recalcBusy ? "A calcular..." : "Recalcular initialPoints"}
          </Button>
        </Card>
      </main>
    </Protected>
  );
}
