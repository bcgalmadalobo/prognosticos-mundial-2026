"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { listUsers } from "@/lib/db";
import type { AppUser } from "@/types";

function formatDate(val: unknown): string {
  if (!val) return "—";
  if (typeof val === "object" && val !== null && "toDate" in val) {
    return (val as { toDate(): Date }).toDate().toLocaleDateString("pt-PT");
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-PT");
  }
  return "—";
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "green" | "amber" | "blue" | "neon" | "pitch";
}) {
  const cls = {
    green: "border-green-500/40 bg-green-900/30 text-green-400",
    amber: "border-amber-500/40 bg-amber-900/30 text-amber-400",
    blue: "border-blue-500/40 bg-blue-900/30 text-blue-400",
    neon: "border-neon-500/40 bg-neon-900/20 text-neon-400",
    pitch: "border-pitch-500 bg-pitch-700 text-pitch-300",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1 rounded px-1 py-0.5 text-xs text-pitch-400 transition-colors hover:bg-pitch-600 hover:text-pitch-100"
      title={`Copiar ${text}`}
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

export default function ParticipantesPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setError("Erro ao carregar participantes."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phoneNumber ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      approved: users.filter((u) => u.approved).length,
      pending: users.filter((u) => !u.approved).length,
      withBet: users.filter((u) => u.hasSubmittedInitialPrediction).length,
      withNotifications: users.filter((u) => !!u.oneSignalId).length,
    }),
    [users]
  );

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-5xl space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Participantes</h1>
            <p className="mt-0.5 text-sm text-pitch-300">
              Lista de todos os utilizadores registados.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-pitch-500 px-3 py-1.5 text-sm font-medium text-pitch-200 transition-colors hover:border-pitch-400 hover:text-pitch-50"
          >
            ← Admin
          </a>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-400">
            <span className="mt-0.5 shrink-0">&#10005;</span>
            <p>{error}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: stats.total },
              { label: "Aprovados", value: stats.approved },
              { label: "Pendentes", value: stats.pending },
              { label: "Com aposta", value: stats.withBet },
              { label: "Notificações", value: stats.withNotifications },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-pitch-500 bg-pitch-800 p-3 text-center"
              >
                <p className="text-xl font-bold text-pitch-50">{s.value}</p>
                <p className="text-xs text-pitch-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, email ou telemóvel…"
          className="w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
        />

        {/* Table */}
        <Card
          title={
            loading
              ? "A carregar…"
              : `${filtered.length} participante${filtered.length !== 1 ? "s" : ""}${search ? " (filtrado)" : ""}`
          }
        >
          {loading ? (
            <p className="text-sm text-pitch-400">A carregar participantes…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-pitch-400">Nenhum participante encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pitch-600">
                    {["Nome", "Email", "Telemóvel", "Role / Estado", "Badges", "Desde"].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-pitch-400 last:pr-0"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitch-700">
                  {filtered.map((u) => (
                    <tr key={u.uid} className="hover:bg-pitch-700/30">
                      <td className="py-2.5 pr-4 font-medium text-pitch-100">{u.name}</td>
                      <td className="py-2.5 pr-4 text-pitch-300">
                        <span className="inline-flex items-center gap-0.5">
                          <span className="max-w-[180px] truncate">{u.email}</span>
                          <CopyButton text={u.email} />
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-pitch-300">
                        {u.phoneNumber ? (
                          <span className="inline-flex items-center gap-0.5">
                            {u.phoneNumber}
                            <CopyButton text={u.phoneNumber} />
                          </span>
                        ) : (
                          <span className="text-pitch-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-pitch-200">{u.role}</span>
                          <span className="text-xs text-pitch-500">{u.status ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {u.role === "admin" && <Badge variant="blue">Admin</Badge>}
                          {u.approved ? (
                            <Badge variant="green">Aprovado</Badge>
                          ) : (
                            <Badge variant="amber">Pendente</Badge>
                          )}
                          {u.hasSubmittedInitialPrediction && (
                            <Badge variant="neon">Aposta</Badge>
                          )}
                          {u.oneSignalId && <Badge variant="pitch">Notif.</Badge>}
                        </div>
                      </td>
                      <td className="py-2.5 text-pitch-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </Protected>
  );
}
