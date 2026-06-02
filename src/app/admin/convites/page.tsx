"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { listInvites, listUsers } from "@/lib/db";
import { auth } from "@/lib/firebase";
import type { AppUser, Invite } from "@/types";

export default function ConvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [rows, users] = await Promise.all([listInvites(), listUsers()]);
      setInvites(rows);
      setPendingUsers(users.filter((u) => !u.approved && u.role !== "admin"));
    } catch {
      setError("Erro ao carregar dados.");
    }
  }

  async function handleGenerateCode(target: AppUser) {
    setBusy(target.uid);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Nao autenticado.");

      const res = await fetch("/api/admin/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: target.uid, email: target.email, name: target.name }),
      });
      const data = await res.json() as { code?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar codigo.");

      setGeneratedCodes((prev) => ({ ...prev, [target.uid]: data.code! }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar codigo.");
    } finally {
      setBusy(null);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Convites</h1>
            <p className="mt-0.5 text-sm text-pitch-300">Gera e gere os códigos de acesso.</p>
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

        <Card title={`Utilizadores pendentes (${pendingUsers.length})`}>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-pitch-400">Nenhum utilizador pendente de ativação.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.uid}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-amber-500/30 bg-amber-900/20 p-3 text-sm md:grid-cols-4"
                >
                  <div className="md:col-span-1">
                    <p className="font-semibold text-amber-300">{u.name}</p>
                    <p className="truncate text-amber-400/80">{u.email}</p>
                  </div>
                  <div className="flex items-center md:col-span-1">
                    {generatedCodes[u.uid] ? (
                      <span className="font-mono font-bold tracking-widest text-neon-400">
                        {generatedCodes[u.uid]}
                      </span>
                    ) : (
                      <span className="text-xs text-pitch-400">Sem código gerado</span>
                    )}
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateCode(u)}
                      disabled={busy === u.uid}
                    >
                      {busy === u.uid ? "A gerar..." : "Gerar código"}
                    </Button>
                    {generatedCodes[u.uid] && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyCode(generatedCodes[u.uid])}
                      >
                        {copied === generatedCodes[u.uid] ? "Copiado!" : "Copiar"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={`Histórico de ativações (${invites.length})`}>
          {invites.length === 0 ? (
            <p className="text-sm text-pitch-400">Nenhum convite ainda.</p>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-5 gap-2 text-xs font-semibold uppercase tracking-wide text-pitch-400 md:grid">
                <span>Código</span>
                <span>Nome</span>
                <span>Email</span>
                <span>Estado</span>
                <span>Ação</span>
              </div>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className={`grid grid-cols-2 gap-2 rounded-xl border p-3 text-sm md:grid-cols-5 ${
                    inv.used
                      ? "border-pitch-500 bg-pitch-700/40"
                      : "border-green-500/30 bg-green-900/20"
                  }`}
                >
                  <span className="font-mono font-bold tracking-widest text-pitch-100">
                    {inv.code}
                  </span>
                  <span className="text-pitch-200">{inv.expectedName}</span>
                  <span className="truncate text-pitch-300">{inv.expectedEmail}</span>
                  <span>
                    {inv.used ? (
                      <span className="inline-flex items-center rounded-full border border-pitch-500 bg-pitch-700 px-2 py-0.5 text-xs font-medium text-pitch-300">
                        Usado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-green-500/40 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">
                        Disponível
                      </span>
                    )}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyCode(inv.code)}
                    disabled={inv.used}
                  >
                    {copied === inv.code ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </Protected>
  );
}
