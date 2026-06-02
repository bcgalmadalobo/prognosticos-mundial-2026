"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Protected } from "@/components/Protected";
import { auth } from "@/lib/firebase";

const fieldCls =
  "w-full rounded-xl border border-pitch-500 bg-pitch-900 px-3 py-2.5 text-sm text-pitch-50 placeholder:text-pitch-400 focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500";

export default function NotificacoesPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Nao autenticado.");

      const res = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || undefined,
        }),
      });

      const data = await res.json() as {
        sent?: boolean;
        message?: string;
        recipientCount?: number;
        error?: string;
      };

      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Erro ao enviar notificacao." });
        return;
      }

      if (!data.sent) {
        setFeedback({ ok: false, text: data.message ?? "Nenhum utilizador com notificacoes ativas." });
        return;
      }

      setFeedback({
        ok: true,
        text: `Notificacao enviada para ${data.recipientCount} utilizador(es).`,
      });
      setTitle("");
      setMessage("");
      setUrl("");
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Erro ao enviar notificacao.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Protected adminOnly>
      <main className="mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pitch-50">Notificações</h1>
            <p className="mt-0.5 text-sm text-pitch-300">
              Enviar notificacao push para todos os participantes com notificacoes ativas.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-pitch-500 px-3 py-1.5 text-sm font-medium text-pitch-200 transition-colors hover:border-pitch-400 hover:text-pitch-50"
          >
            ← Admin
          </a>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {feedback && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                feedback.ok
                  ? "border-green-500/30 bg-green-900/30 text-green-400"
                  : "border-red-500/30 bg-red-900/30 text-red-400"
              }`}
            >
              <span className="mt-0.5 shrink-0">{feedback.ok ? "✓" : "✕"}</span>
              <p>{feedback.text}</p>
            </div>
          )}

          <Card title="Titulo">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novos jogos disponiveis!"
              maxLength={100}
              required
              className={fieldCls}
            />
          </Card>

          <Card title="Mensagem">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Ja podes fazer as tuas apostas para os oitavos de final."
              rows={3}
              maxLength={300}
              required
              className={fieldCls}
            />
            <p className="mt-1 text-right text-xs text-pitch-400">{message.length}/300</p>
          </Card>

          <Card title="URL (opcional)">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://prognosticos.vercel.app/dashboard"
              className={fieldCls}
            />
            <p className="mt-1 text-xs text-pitch-400">
              Se preenchido, abre esta pagina ao clicar na notificacao.
            </p>
          </Card>

          <Button disabled={sending} className="w-full py-3">
            {sending ? "A enviar..." : "Enviar notificacao"}
          </Button>
        </form>
      </main>
    </Protected>
  );
}
