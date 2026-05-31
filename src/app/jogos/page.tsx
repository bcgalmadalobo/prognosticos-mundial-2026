"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";
import { listMatches, saveMatchPrediction } from "@/lib/db";
import type { Match, MatchPrediction, Outcome90, ScoreLine } from "@/types";

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listMatches("open").then(setMatches).catch((err) => {
      console.error(err);
      setError("Erro ao carregar jogos abertos.");
    });
  }, []);

  function parseScore120(value: FormDataEntryValue | null): ScoreLine | null {
    const raw = String(value ?? "").trim();

    if (!raw) {
      return null;
    }

    const parts = raw.split("-").map((x) => Number(x.trim()));

    if (parts.length !== 2) {
      return null;
    }

    if (!parts.every(Number.isFinite)) {
      return null;
    }

    return {
      homeGoals: parts[0],
      awayGoals: parts[1],
    };
  }

  async function submit(e: FormEvent<HTMLFormElement>, match: Match) {
    e.preventDefault();

    if (!user) {
      setError("Tens de estar autenticado para apostar.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const score120 = parseScore120(form.get("score120"));

    const prediction: MatchPrediction = {
      userId: user.uid,
      matchId: match.id,
      prediction90: form.get("prediction90") as Outcome90,
      qualifiedTeam: String(form.get("qualifiedTeam")),
      locked: true,
    };

    if (score120) {
      prediction.score120 = score120;
    }

    try {
      setError("");
      await saveMatchPrediction(prediction);
      setSaved(match.id);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar aposta. Confirma se estás autenticado e se o jogo ainda está aberto.");
    }
  }

  return (
    <Protected>
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-2xl font-bold">Jogos abertos</h1>

        {error ? (
          <p className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>
        ) : null}

        {matches.length === 0 ? (
          <Card>Nao ha jogos abertos neste momento.</Card>
        ) : null}

        {matches.map((match) => (
          <Card key={match.id} title={`${match.homeTeam} vs ${match.awayTeam}`}>
            <form onSubmit={(e) => submit(e, match)} className="space-y-3">
              <select name="prediction90" className="w-full rounded-xl border p-3" required>
                <option value="home">Vitoria {match.homeTeam} aos 90 min</option>
                <option value="draw">Empate aos 90 min</option>
                <option value="away">Vitoria {match.awayTeam} aos 90 min</option>
              </select>

              <select name="qualifiedTeam" className="w-full rounded-xl border p-3" required>
                <option value={match.homeTeam}>Passa {match.homeTeam}</option>
                <option value={match.awayTeam}>Passa {match.awayTeam}</option>
              </select>

              {match.round === "quarter_final" || match.round === "semi_final" || match.round === "final" ? (
                <input
                  name="score120"
                  className="w-full rounded-xl border p-3"
                  placeholder="Resultado 120 min, ex: 2-1"
                />
              ) : null}

              <Button>Guardar aposta</Button>

              {saved === match.id ? (
                <p className="text-sm text-brand-700">Guardado.</p>
              ) : null}
            </form>
          </Card>
        ))}
      </main>
    </Protected>
  );
}
