"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

export default function AtivarPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role === "admin" || user.approved) { router.push("/dashboard"); return; }
  }, [loading, user, router]);

  async function handleActivate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Nao autenticado.");

      const res = await fetch("/api/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao ativar.");

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading) return <main className="p-4">A carregar...</main>;
  if (!user || user.role === "admin" || user.approved) return null;

  return (
    <main className="mx-auto max-w-md p-4 pt-10">
      <Card title="Ativar conta">
        <p className="mb-4 text-sm text-pitch-200">
          A tua conta foi criada com sucesso. Aguarda que o organizador te envie o teu
          codigo de acesso e introduz-o aqui para entrar na app.
        </p>
        <form onSubmit={handleActivate} className="space-y-3">
          <input
            className="w-full rounded-xl border p-3 uppercase tracking-widest"
            placeholder="Codigo de acesso"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          <Button disabled={busy} className="w-full">
            {busy ? "A ativar..." : "Ativar conta"}
          </Button>
        </form>
        <button className="mt-4 text-sm text-neon-400" onClick={handleLogout}>
          Sair
        </button>
      </Card>
    </main>
  );
}
