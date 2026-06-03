"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initOneSignal } from "@/lib/onesignal";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      unsubDoc?.();
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      unsubDoc = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
        if (snap.exists()) {
          setUser({ uid: fbUser.uid, ...snap.data() } as AppUser);
        } else {
          setUser({ uid: fbUser.uid, email: fbUser.email ?? "", name: fbUser.email ?? "User", role: "user" });
        }
        setLoading(false);
      });
    });
    return () => {
      unsubDoc?.();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (user?.uid) void initOneSignal(user.uid);
  }, [user?.uid]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async register(name, email, password, phoneNumber) {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registar.");
      await signInWithEmailAndPassword(auth, email, password);
    },
    logout: () => signOut(auth),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
