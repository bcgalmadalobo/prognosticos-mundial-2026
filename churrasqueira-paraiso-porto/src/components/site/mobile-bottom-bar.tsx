import Link from "next/link";
import { MapPin, MenuSquare, Phone, Send } from "lucide-react";

import type { Locale } from "@/data/restaurant";
import { primaryContactActions } from "@/data/restaurant";
import { dictionaries, localizedHref } from "@/i18n/dictionaries";

const bottomActions = [
  { key: "call", href: primaryContactActions[0].href, icon: Phone, internal: false },
  { key: "whatsapp", href: primaryContactActions[1].href, icon: Send, internal: false },
  { key: "directions", href: primaryContactActions[2].href, icon: MapPin, internal: false },
  { key: "menu", href: "/menu", icon: MenuSquare, internal: true },
] as const;

export function MobileBottomBar({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-stone-800 bg-[#201714] text-stone-50 shadow-2xl lg:hidden"
      aria-label="Acoes rapidas"
    >
      {bottomActions.map((action) => {
        const Icon = action.icon;
        const className =
          "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition hover:bg-white/10";

        if (action.internal) {
          return (
            <Link key={action.key} href={localizedHref(action.href, locale)} className={className}>
              <Icon className="size-5 text-[#f2c56b]" />
              {t.nav.menu}
            </Link>
          );
        }

        return (
          <a key={action.key} href={action.href} className={className}>
            <Icon className="size-5 text-[#f2c56b]" />
            {action.key === "call"
              ? t.cta.call
              : action.key === "whatsapp"
                ? t.cta.whatsapp
                : t.hero.directions}
          </a>
        );
      })}
    </nav>
  );
}
