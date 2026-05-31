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
            {rows.length === 0 ? <p className="text-slate-600">Ainda nao ha pontuacao.</p> : null}
            {rows.map((row, index) => (
              <div key={row.userId} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-semibold">#{index + 1} {row.name}</p>
                  <p className="text-xs text-slate-500">Inicial {row.initialPoints} | Jogos {row.knockoutPoints}</p>
                </div>
                <p className="text-xl font-bold text-brand-700">{row.totalPoints}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </Protected>
  );
}
