"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
        router.push("/ativar");
      } else {
        await login(email, password);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  const inputClass =
    "w-full rounded-xl border border-pitch-500 bg-pitch-700 px-4 py-3 text-pitch-50 placeholder-pitch-400 focus:outline-none focus:border-neon-500 focus:ring-1 focus:ring-neon-500 transition-colors";

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
        <div className="flex border-b border-pitch-500">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={[
                "flex-1 py-3 text-sm font-semibold transition-colors duration-150",
                mode === m
                  ? "text-neon-400 border-b-2 border-neon-500 bg-pitch-800"
                  : "text-pitch-300 hover:text-pitch-100 bg-pitch-700",
              ].join(" ")}
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-pitch-300 uppercase tracking-wide">
                  Nome
                </label>
                <input
                  className={inputClass}
                  placeholder="O teu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-pitch-300 uppercase tracking-wide">
                Email
              </label>
              <input
                className={inputClass}
                placeholder="o-teu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-pitch-300 uppercase tracking-wide">
                Password
              </label>
              <input
                className={inputClass}
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-pitch-300 uppercase tracking-wide">
                  Confirmar password
                </label>
                <input
                  className={inputClass}
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3">
                <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button disabled={busy} size="lg" className="w-full mt-1">
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
                  {mode === "login" ? "A entrar..." : "A criar conta..."}
                </>
              ) : (
                mode === "login" ? "Entrar" : "Criar conta"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
