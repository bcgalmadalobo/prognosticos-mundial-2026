"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { requestPushPermission } from "@/lib/onesignal";
import { updateOneSignalId } from "@/lib/db";
import { Button } from "@/components/Button";

type Status = "idle" | "loading" | "granted" | "denied" | "unsupported";

function getInitialStatus(): Status {
  if (typeof window === "undefined") return "idle";
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") return "granted";
  return "idle";
}

export function NotificationButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    setStatus(getInitialStatus());
  }, []);

  async function handleActivate() {
    setStatus("loading");
    try {
      const id = await requestPushPermission();
      if (id) {
        if (user?.uid) await updateOneSignalId(user.uid, id);
        setStatus("granted");
      } else if (typeof window !== "undefined" && Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2 text-sm text-neon-400">
        <BellRing className="h-4 w-4" />
        Notificações ativas
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-400">
        <BellOff className="h-4 w-4 shrink-0" />
        <span>
          Notificações bloqueadas. Para ativar, clica no ícone do cadeado na barra de endereço e permite notificações.
        </span>
      </div>
    );
  }

  return (
    <Button onClick={handleActivate} disabled={status === "loading"} size="sm">
      {status === "loading" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          A ativar…
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Ativar notificações
        </>
      )}
    </Button>
  );
}
