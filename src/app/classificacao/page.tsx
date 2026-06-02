"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { listLeaderboard } from "@/lib/db";
import type { LeaderboardEntry } from "@/types";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 text-gold-400"
      aria-hidden="true"
    >
      <path d="M2 20h20v2H2v-2zm2-2V9l4 3.5 4-7 4 7 4-3.5v9H4z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-16 w-16 text-pitch-500"
      aria-hidden="true"
    >
      <path d="M11 17.9V19H8v2h8v-2h-3v-1.1A8 8 0 0016 10V4H8v6a8 8 0 003 4.9zM4 6H2v4a4 4 0 004 4v-2a2 2 0 01-2-2V6zm16 0h-2v4a2 2 0 01-2 2v2a4 4 0 004-4V6z" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3">
      <div className="h-4 w-4 rounded bg-pitch-600" />
      <div className="h-9 w-9 rounded-full bg-pitch-600" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-pitch-600" />
        <div className="h-2 w-24 rounded bg-pitch-700" />
      </div>
      <div className="h-6 w-10 rounded bg-pitch-600" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <TrophyIcon />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-pitch-100">
          A classificação ainda não está disponível
        </p>
        <p className="text-sm text-pitch-400">
          As pontuações serão calculadas após o início dos jogos.
        </p>
      </div>
    </div>
  );
}

const PODIUM_STYLES = {
  1: {
    ring: "ring-gold-400",
    avatarText: "text-gold-400",
    avatarBg: "bg-gold-400/10",
    pointsText: "text-gold-400",
    platformBg: "bg-gold-gradient shadow-gold",
    platformH: "h-28",
    numText: "text-pitch-900",
  },
  2: {
    ring: "ring-pitch-100",
    avatarText: "text-pitch-100",
    avatarBg: "bg-pitch-100/10",
    pointsText: "text-pitch-100",
    platformBg: "bg-pitch-600",
    platformH: "h-20",
    numText: "text-pitch-300",
  },
  3: {
    ring: "ring-gold-600",
    avatarText: "text-gold-600",
    avatarBg: "bg-gold-600/10",
    pointsText: "text-gold-600",
    platformBg: "bg-pitch-700",
    platformH: "h-14",
    numText: "text-pitch-400",
  },
} as const;

function PodiumSpot({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}) {
  const c = PODIUM_STYLES[rank];
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-7 items-center justify-center">
        {rank === 1 && <CrownIcon />}
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 ${c.ring} ${c.avatarBg}`}
      >
        <span className={`text-sm font-bold ${c.avatarText}`}>
          {initials(entry.name)}
        </span>
      </div>
      <p className="mt-1 max-w-[72px] truncate text-center text-xs font-semibold leading-tight text-pitch-50">
        {entry.name}
      </p>
      <p className={`text-xl font-black ${c.pointsText}`}>
        {entry.totalPoints}
      </p>
      <p className="-mt-1 text-[10px] text-pitch-500">pts</p>
      <div
        className={`mt-2 flex w-20 items-end justify-center rounded-t-xl pb-3 sm:w-24 ${c.platformBg} ${c.platformH}`}
      >
        <span className={`text-2xl font-black ${c.numText}`}>{rank}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pitch-600 bg-pitch-800 px-4 py-3 transition-colors hover:bg-pitch-700/50">
      <span className="w-6 shrink-0 text-center text-sm font-bold text-pitch-400">
        {rank}
      </span>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pitch-700">
        <span className="text-xs font-bold text-pitch-200">
          {initials(entry.name)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-pitch-50">
          {entry.name}
        </p>
        <p className="text-xs text-pitch-400">
          Ini {entry.initialPoints} · Jog {entry.knockoutPoints}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-black text-neon-400">{entry.totalPoints}</p>
        <p className="-mt-1 text-[10px] text-pitch-500">pts</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLeaderboard()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Protected>
      <main className="mx-auto max-w-2xl space-y-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-pitch-50">Classificação</h1>
          <p className="mt-1 text-sm text-pitch-400">Mundial 2026</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-pitch-600 bg-pitch-800">
            <EmptyState />
          </div>
        ) : (
          <div className="space-y-4">
            {rows.length >= 3 && (
              <div className="overflow-hidden rounded-2xl border border-pitch-600 bg-pitch-800 px-4 pb-0 pt-6">
                <div className="flex items-end justify-center gap-2 sm:gap-6">
                  <PodiumSpot entry={rows[1]} rank={2} />
                  <PodiumSpot entry={rows[0]} rank={1} />
                  <PodiumSpot entry={rows[2]} rank={3} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {rows.map((row, i) => (
                <LeaderboardRow key={row.userId} entry={row} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </main>
    </Protected>
  );
}
