import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

function buildDb() {
  // SSR: IndexedDB unavailable, use memory-only Firestore
  if (typeof window === "undefined") return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Firestore already initialized (e.g. HMR) — reuse existing instance
    return getFirestore(app);
  }
}

export const db = buildDb();
export default app;
