import Link from "next/link";
import { Menu, Phone } from "lucide-react";

import type { Locale } from "@/data/restaurant";
import { primaryContactActions, restaurant } from "@/data/restaurant";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dictionaries, localeLabels, locales, localizedHref } from "@/i18n/dictionaries";

const navItems = [
  { key: "home", href: "/" },
  { key: "menu", href: "/menu" },
  { key: "specialties", href: "/#especialidades" },
  { key: "reviews", href: "/#avaliacoes" },
  { key: "about", href: "/#sobre" },
  { key: "location", href: "/#localizacao" },
] as const;

type SiteHeaderProps = {
  locale: Locale;
  pathname?: "/" | "/menu";
};

export function SiteHeader({ locale, pathname = "/" }: SiteHeaderProps) {
  const t = dictionaries[locale];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#201714]/95 text-stone-50 shadow-lg shadow-black/10 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={localizedHref("/", locale)} className="flex items-center gap-3" aria-label="Pagina inicial">
          <span className="grid size-10 place-items-center rounded-md bg-[#b73323] font-serif text-xl font-bold text-white">
            P
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-[#f2c56b]">
              Churrasqueira
            </span>
            <span className="block text-base font-bold">{restaurant.shortName}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-stone-200 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={localizedHref(item.href, locale)}
              className="transition hover:text-[#f2c56b]"
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex rounded-md border border-white/15 bg-white/5 p-1 text-xs font-semibold">
            {locales.map((language) => (
              <Link
                key={language}
                href={localizedHref(pathname, language)}
                className={
                  language === locale
                    ? "rounded bg-[#f2c56b] px-2.5 py-1 text-[#201714]"
                    : "rounded px-2.5 py-1 text-stone-300 hover:text-white"
                }
              >
                {localeLabels[language]}
              </Link>
            ))}
          </div>
          <Button asChild className="bg-[#f2c56b] text-[#201714] hover:bg-[#ffd982]">
            <a href={primaryContactActions[0].href}>
              <Phone className="size-4" />
              {t.header.order}
            </a>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-lg text-white transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-6" />
          </SheetTrigger>
          <SheetContent side="right" className="border-stone-800 bg-[#201714] text-stone-50">
            <SheetHeader>
              <SheetTitle className="text-left text-stone-50">{restaurant.shortName}</SheetTitle>
              <SheetDescription className="text-left text-stone-300">
                {t.header.menuDescription}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8 grid gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={localizedHref(item.href, locale)}
                  className="rounded-md px-3 py-3 text-base font-medium text-stone-100 hover:bg-white/10"
                >
                  {t.nav[item.key]}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex gap-2">
              {locales.map((language) => (
                <Link
                  key={language}
                  href={localizedHref(pathname, language)}
                  className={
                    language === locale
                      ? "grid h-10 flex-1 place-items-center rounded-md bg-[#f2c56b] text-sm font-bold text-[#201714]"
                      : "grid h-10 flex-1 place-items-center rounded-md border border-white/15 text-sm font-bold text-stone-200"
                  }
                >
                  {localeLabels[language]}
                </Link>
              ))}
            </div>
            <Button asChild className="mt-6 w-full bg-[#b73323] text-white hover:bg-[#d84430]">
              <a href={primaryContactActions[0].href}>{t.header.callToOrder}</a>
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
