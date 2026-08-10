import Link from "next/link";
import { Phone, Search, ShoppingBag } from "lucide-react";

import { MobileBottomBar } from "@/components/site/mobile-bottom-bar";
import { SiteHeader } from "@/components/site/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuCategories, menuItems, type MenuItem } from "@/data/menu";
import { restaurant, type Locale } from "@/data/restaurant";
import { dictionaries, localizedHref, normalizeLocale } from "@/i18n/dictionaries";

type MenuPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export const metadata = {
  title: "Menu",
  description:
    "Menu digital da Churrasqueira Paraíso do Porto com entradas, sopas, peixe, carne, churrasco, guarnições, sobremesas e bebidas.",
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const t = dictionaries[locale];

  return (
    <>
      <SiteHeader locale={locale} pathname="/menu" />
      <main className="bg-[#fff7e8] pb-24">
        <section className="bg-[#201714] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f2c56b]">
              {t.menuPage.eyebrow}
            </p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-5xl font-black leading-tight sm:text-6xl">
                  {t.menuPage.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-200">
                  {t.menuPage.body}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild className="bg-[#f2c56b] text-[#201714] hover:bg-[#ffd982]">
                  <a href="tel:+351222083456">
                    <Phone className="size-4" />
                    {t.common.call}
                  </a>
                </Button>
                <Button asChild className="bg-[#2d6a4f] text-white hover:bg-[#35845f]">
                  <a href={restaurant.whatsappHref}>
                    <ShoppingBag className="size-4" />
                    {t.common.whatsapp}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Tabs defaultValue="all" className="w-full">
              <div className="sticky top-16 z-30 -mx-4 border-y border-[#e3c999] bg-[#fff7e8]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
                  <TabsTrigger value="all" className="min-h-10 shrink-0 rounded-md px-4">
                    <Search className="size-4" />
                    {t.menuPage.all}
                  </TabsTrigger>
                  {menuCategories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="min-h-10 shrink-0 rounded-md px-4"
                    >
                      {category.label[locale]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-8">
                <MenuGrid items={menuItems} locale={locale} />
              </TabsContent>

              {menuCategories.map((category) => (
                <TabsContent key={category.id} id={category.id} value={category.id} className="mt-8">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-3xl font-black text-[#251a16]">{category.label[locale]}</h2>
                    <Link
                      href={localizedHref("/menu", locale)}
                      className="text-sm font-bold text-[#b73323] underline-offset-4 hover:underline"
                    >
                      {t.menuPage.all}
                    </Link>
                  </div>
                  <MenuGrid
                    items={menuItems.filter((item) => item.category === category.id)}
                    locale={locale}
                  />
                </TabsContent>
              ))}
            </Tabs>
            <p className="mt-10 rounded-md border border-[#e3c999] bg-[#fbecd1] p-4 text-sm font-semibold text-[#624f42]">
              {t.menuPage.sourceNote}
            </p>
          </div>
        </section>
      </main>
      <MobileBottomBar locale={locale} />
    </>
  );
}

function MenuGrid({ items, locale }: { items: MenuItem[]; locale: Locale }) {
  const t = dictionaries[locale];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-md border border-[#e3c999] bg-[#fffaf0] p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#251a16]">{item.name}</h3>
              {item.portion ? (
                <p className="mt-1 text-sm font-semibold text-[#8a6a43]">{item.portion}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {item.price ? <span className="text-lg font-black text-[#b73323]">{item.price}</span> : null}
              {item.popular ? <Badge className="bg-[#f2c56b] text-[#251a16]">{t.menuPage.popular}</Badge> : null}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#624f42]">{item.description[locale]}</p>
          {!item.available ? (
            <p className="mt-3 text-sm font-bold text-[#b73323]">{t.menuPage.unavailable}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
