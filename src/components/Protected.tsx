"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role === "admin") return; // admins always have full access
    if (!user.approved) { router.push("/ativar"); return; }
    if (adminOnly) router.push("/dashboard");
  }, [loading, user, adminOnly, router]);

  if (loading) return <main className="p-4">A carregar...</main>;
  if (!user) return null;
  if (user.role !== "admin" && !user.approved) return null;
  if (adminOnly && user.role !== "admin") return null;
  return <>{children}</>;
}
