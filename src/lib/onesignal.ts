import { updateOneSignalId } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OneSignalInstance = any;

export async function initOneSignal(uid?: string) {
  if (typeof window === "undefined") return;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return;

  const w = window as unknown as { OneSignalDeferred?: Array<(os: OneSignalInstance) => void> };
  w.OneSignalDeferred = w.OneSignalDeferred || [];
  w.OneSignalDeferred.push(async (OneSignal: OneSignalInstance) => {
    await OneSignal.init({ appId, autoPrompt: false });
    if (uid) {
      try {
        // PushSubscription.id is a string getter, not a Promise
        const id: string | null = OneSignal.User.PushSubscription.id;
        if (id) await updateOneSignalId(uid, id);
      } catch {
        // Non-fatal. User may not have granted permission yet.
      }
    }
  });
}

export async function requestPushPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { OneSignal?: OneSignalInstance };
  if (!w.OneSignal) return null;
  await w.OneSignal.Notifications.requestPermission();
  return (w.OneSignal.User?.PushSubscription?.id as string | null) ?? null;
}
