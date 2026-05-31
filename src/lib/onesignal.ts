import { updateOneSignalId } from "@/lib/db";

export async function initOneSignal(uid?: string) {
  if (typeof window === "undefined") return;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return;

  const w = window as unknown as { OneSignalDeferred?: Array<(OneSignal: any) => void> };
  w.OneSignalDeferred = w.OneSignalDeferred || [];
  w.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.init({ appId });
    if (uid) {
      try {
        const id = await OneSignal.User.PushSubscription.id;
        if (id) await updateOneSignalId(uid, id);
      } catch {
        // Non-fatal. User may not have granted permission yet.
      }
    }
  });
}

export async function requestPushPermission() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { OneSignal?: any };
  if (!w.OneSignal) return null;
  await w.OneSignal.Notifications.requestPermission();
  return w.OneSignal.User?.PushSubscription?.id ?? null;
}
