"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { listLeaderboard } from "@/lib/db";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  useEffect(() => { listLeaderboard().then(setRows); }, []);

  return (
    <Protected>
      <main className="mx-auto max-w-3xl p-4">
        <Card title="Classificacao">
          <div className="space-y-2">
            {rows.length === 0 ? <p className="text-pitch-200">Ainda nao ha pontuacao.</p> : null}
            {rows.map((row, index) => (
              <div key={row.userId} className="flex items-center justify-between rounded-xl border border-pitch-500 p-3">
                <div>
                  <p className="font-semibold text-pitch-50">#{index + 1} {row.name}</p>
                  <p className="text-xs text-pitch-300">Inicial {row.initialPoints} | Jogos {row.knockoutPoints}</p>
                </div>
                <p className="text-xl font-bold text-neon-400">{row.totalPoints}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </Protected>
  );
}
