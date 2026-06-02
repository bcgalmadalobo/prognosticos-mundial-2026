"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
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
      if (!token) throw new Error("Não autenticado.");

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

  if (loading) {
    return (
      <main className="min-h-screen bg-pitch-gradient flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-neon-500" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </main>
    );
  }

  if (!user || user.role === "admin" || user.approved) return null;

  return (
    <main className="min-h-screen bg-pitch-gradient flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/worldcup-logo.png.png"
          alt="Logo da competição"
          width={96}
          height={96}
          className="h-20 w-auto object-contain drop-shadow-lg"
        />
        <div className="text-center">
          <h1 className="text-xl font-bold text-pitch-50 tracking-wide">Prognósticos</h1>
          <p className="text-sm text-pitch-300 tracking-widest uppercase">Mundial 2026</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-pitch-500 bg-pitch-800 shadow-card overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-pitch-600">
          <h2 className="text-base font-semibold text-pitch-50">Ativar conta</h2>
          <p className="text-sm text-pitch-300 mt-1">
            Conta criada com sucesso. Introduz o código que o organizador te enviou.
          </p>
        </div>

        <div className="px-6 py-4 space-y-3 border-b border-pitch-600">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-500/20 text-neon-400 text-xs font-bold">
              ✓
            </span>
            <span className="text-sm text-pitch-300">Conta criada</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitch-600 text-pitch-400 text-xs font-bold">
              2
            </span>
            <span className="text-sm text-pitch-400">Aguarda o código do organizador</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-500 text-pitch-950 text-xs font-bold">
              3
            </span>
            <span className="text-sm text-pitch-50 font-medium">Introduz o código abaixo</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleActivate} className="space-y-4">
            <input
              className="w-full rounded-xl border border-pitch-500 bg-pitch-700 px-4 py-4 text-center text-2xl font-mono font-bold text-pitch-50 uppercase tracking-[0.5em] placeholder-pitch-500 focus:outline-none focus:border-neon-500 focus:ring-1 focus:ring-neon-500 transition-colors"
              placeholder="XXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              spellCheck={false}
              maxLength={10}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3">
                <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button disabled={busy} size="lg" className="w-full">
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  A ativar...
                </>
              ) : (
                "Ativar conta"
              )}
            </Button>
          </form>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-pitch-400 hover:text-pitch-200 transition-colors underline underline-offset-2"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
