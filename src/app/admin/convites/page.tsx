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
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Convites</h1>
          <a href="/admin" className="text-sm text-neon-400">← Admin</a>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>
        )}

        <Card title={`Utilizadores pendentes (${pendingUsers.length})`}>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-pitch-300">Nenhum utilizador pendente de ativacao.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.uid}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm md:grid-cols-4"
                >
                  <div className="md:col-span-1">
                    <p className="font-semibold text-amber-900">{u.name}</p>
                    <p className="truncate text-amber-800">{u.email}</p>
                  </div>
                  <div className="flex items-center md:col-span-1">
                    {generatedCodes[u.uid] ? (
                      <span className="font-mono font-bold tracking-widest text-green-700">
                        {generatedCodes[u.uid]}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700">Sem codigo gerado</span>
                    )}
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button
                      onClick={() => handleGenerateCode(u)}
                      disabled={busy === u.uid}
                    >
                      {busy === u.uid ? "A gerar..." : "Gerar codigo"}
                    </Button>
                    {generatedCodes[u.uid] && (
                      <Button onClick={() => copyCode(generatedCodes[u.uid])}>
                        {copied === generatedCodes[u.uid] ? "Copiado!" : "Copiar"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={`Historico de activacoes (${invites.length})`}>
          {invites.length === 0 ? (
            <p className="text-sm text-pitch-300">Nenhum convite ainda.</p>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-5 gap-2 text-xs font-semibold text-pitch-300 md:grid">
                <span>Codigo</span>
                <span>Nome</span>
                <span>Email</span>
                <span>Estado</span>
                <span>Acao</span>
              </div>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className={`grid grid-cols-2 gap-2 rounded-xl border p-3 text-sm md:grid-cols-5 ${inv.used ? "border-slate-200 bg-slate-50" : "border-green-200 bg-green-50"}`}
                >
                  <span className="font-mono font-bold tracking-widest text-slate-900">{inv.code}</span>
                  <span className="text-slate-700">{inv.expectedName}</span>
                  <span className="truncate text-slate-600">{inv.expectedEmail}</span>
                  <span className={inv.used ? "text-slate-500" : "font-semibold text-green-700"}>
                    {inv.used ? "Usado" : "Disponivel"}
                  </span>
                  <Button onClick={() => copyCode(inv.code)} disabled={inv.used}>
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
