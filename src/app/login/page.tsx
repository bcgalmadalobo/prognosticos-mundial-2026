"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
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
      setError("As passwords nao coincidem.");
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

  return (
    <main className="mx-auto max-w-md p-4 pt-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <Image
          src="/worldcup-logo.png.png"
          alt="Logo da competição"
          width={80}
          height={80}
          className="h-16 w-auto max-w-[80px] object-contain"
        />
        <p className="text-sm font-semibold text-pitch-200 tracking-wide">
          Prognósticos Mundial 2026
        </p>
      </div>
      <Card title={mode === "login" ? "Entrar" : "Criar conta"}>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Confirmar password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          <Button disabled={busy} className="w-full">
            {busy ? "Aguarda..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button
          className="mt-4 text-sm text-neon-400"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "Ainda nao tenho conta" : "Ja tenho conta"}
        </button>
      </Card>
    </main>
  );
}
