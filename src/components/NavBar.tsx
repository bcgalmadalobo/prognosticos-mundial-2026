"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Trophy,
  Gamepad2,
  BarChart3,
  BookOpen,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard",      label: "Início",   icon: Home },
  { href: "/aposta-inicial", label: "Aposta",   icon: Trophy },
  { href: "/jogos",          label: "Jogos",    icon: Gamepad2 },
  { href: "/classificacao",  label: "Ranking",  icon: BarChart3 },
  { href: "/regras",         label: "Regras",   icon: BookOpen },
];

export function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="sticky top-0 z-30 hidden border-b border-pitch-500 bg-pitch-900/95 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-pitch-50 transition-opacity hover:opacity-80"
          >
            <span className="text-2xl">⚽</span>
            <span>
              Prognósticos{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                Mundial 2026
              </span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-neon-500/15 text-neon-400"
                      : "text-pitch-200 hover:bg-pitch-700 hover:text-pitch-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-gold-500/15 text-gold-400"
                    : "text-pitch-200 hover:bg-pitch-700 hover:text-pitch-50"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* User area */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-pitch-300 hidden lg:block">
                {user.name ?? user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-pitch-300 transition-colors hover:bg-pitch-700 hover:text-pitch-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile top bar (logo only) ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-pitch-500 bg-pitch-900/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold tracking-tight text-pitch-50"
        >
          <span className="text-xl">⚽</span>
          <span className="text-sm">
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              Mundial 2026
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`rounded-lg p-2 transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-gold-400"
                  : "text-pitch-300"
              }`}
              aria-label="Admin"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-pitch-300 transition-colors hover:text-pitch-50"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-pitch-500 bg-pitch-900/98 backdrop-blur-md md:hidden">
        <div className="flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-neon-400"
                    : "text-pitch-300 hover:text-pitch-50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "stroke-[2.5px]" : "stroke-[1.5px]"}`}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
