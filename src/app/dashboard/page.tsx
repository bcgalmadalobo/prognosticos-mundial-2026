"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/context/AuthContext";
import { initOneSignal, requestPushPermission } from "@/lib/onesignal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [pushId, setPushId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) initOneSignal(user.uid);
  }, [user?.uid]);

  return (
    <Protected>
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <Card title={`Ola, ${user?.name ?? "jogador"}`}>
          <p className="text-pitch-200">Bem-vindo ao jogo privado de prognosticos do Mundial 2026.</p>
        </Card>
        <Card title="Notificacoes">
          <p className="mb-3 text-sm text-pitch-200">Ativa notificacoes para saberes quando ha novos jogos abertos.</p>
          <Button onClick={async () => setPushId(await requestPushPermission())}>Ativar notificacoes</Button>
          {pushId ? <p className="mt-3 text-xs text-pitch-300">Subscricao ativa: {pushId}</p> : null}
          <p className="mt-3 text-xs text-pitch-300">No iPhone, abre no Safari e adiciona ao ecra principal antes de ativar notificacoes.</p>
        </Card>
      </main>
    </Protected>
  );
}
