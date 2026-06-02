"use client";

import { Card } from "@/components/Card";
import { NotificationButton } from "@/components/NotificationButton";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Protected>
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <Card title={`Olá, ${user?.name ?? "jogador"}`}>
          <p className="text-pitch-200">Bem-vindo ao jogo privado de prognósticos do Mundial 2026.</p>
        </Card>
        <Card title="Notificações">
          <p className="mb-3 text-sm text-pitch-300">
            Ativa notificações para saberes quando há novos jogos abertos.
          </p>
          <NotificationButton />
          <p className="mt-3 text-xs text-pitch-400">
            No iPhone, abre no Safari e adiciona ao ecrã principal antes de ativar notificações.
          </p>
        </Card>
      </main>
    </Protected>
  );
}
