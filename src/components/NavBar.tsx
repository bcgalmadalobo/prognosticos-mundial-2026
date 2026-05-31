"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const links = [
  ["/dashboard", "Inicio"],
  ["/aposta-inicial", "Aposta"],
  ["/jogos", "Jogos"],
  ["/classificacao", "Ranking"],
  ["/regras", "Regras"],
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="font-bold text-brand-700">Mundial 2026</Link>
        <nav className="hidden gap-2 md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm ${pathname === href ? "bg-brand-100 text-brand-900" : "text-slate-600"}`}>{label}</Link>
          ))}
          {user?.role === "admin" ? (
            <>
              <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-slate-600">Admin</Link>
              <Link href="/admin/convites" className="rounded-lg px-3 py-2 text-sm text-slate-600">Convites</Link>
            </>
          ) : null}
        </nav>
        {user ? (
          <button onClick={async () => { await logout(); router.push("/login"); }} className="text-sm text-slate-600">Sair</button>
        ) : null}
      </div>
      <nav className="grid grid-cols-5 gap-1 px-2 pb-2 md:hidden">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={`rounded-lg px-2 py-2 text-center text-xs ${pathname === href ? "bg-brand-100 text-brand-900" : "text-slate-600"}`}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
