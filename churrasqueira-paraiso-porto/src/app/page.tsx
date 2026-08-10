import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone, Send, ShieldCheck, ShoppingBag, Utensils } from "lucide-react";

import { MobileBottomBar } from "@/components/site/mobile-bottom-bar";
import { ReviewsCarousel } from "@/components/site/reviews-carousel";
import { SiteHeader } from "@/components/site/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { galleryImages } from "@/data/gallery";
import { menuCategories, menuItems, popularMenuItems } from "@/data/menu";
import { reviews } from "@/data/reviews";
import { restaurant } from "@/data/restaurant";
import { dictionaries, localizedHref, normalizeLocale } from "@/i18n/dictionaries";

type HomeProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const t = dictionaries[locale];
  const featuredItems = popularMenuItems.slice(0, 6);
  const previewCategories = menuCategories.slice(0, 5);
  const restaurantJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    image: restaurant.heroImage.src,
    telephone: restaurant.canonicalPhone,
    priceRange: restaurant.priceRange,
    servesCuisine: restaurant.cuisine,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua do Paraiso 230",
      addressLocality: "Porto",
      addressCountry: "PT",
    },
    url: "https://churrasqueira-paraiso-porto.example.com",
    menu: "https://churrasqueira-paraiso-porto.example.com/menu",
  };

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <section className="relative isolate overflow-hidden bg-[#201714] text-white">
          <Image
            src={restaurant.heroImage.src}
            alt={restaurant.heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(32,23,20,.94),rgba(32,23,20,.72),rgba(32,23,20,.2))]" />
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center px-4 py-16 pb-24 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex rounded-md bg-[#f2c56b] px-3 py-1 text-sm font-bold uppercase tracking-[0.18em] text-[#201714]">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                {t.hero.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-100 sm:text-xl">
                {t.hero.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-[#b73323] text-white hover:bg-[#d84430]">
                  <a href="tel:+351222083456">
                    <Phone className="size-5" />
                    {t.hero.call}
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-[#f2c56b] text-[#201714] hover:bg-[#ffd982]"
                >
                  <Link href={localizedHref("/menu", locale)}>
                    <Utensils className="size-5" />
                    {t.hero.menu}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#201714]"
                >
                  <a href={restaurant.mapsHref}>
                    <MapPin className="size-5" />
                    {t.hero.directions}
                  </a>
                </Button>
              </div>
              <div className="mt-8 grid gap-3 rounded-md border border-white/15 bg-black/25 p-4 text-sm text-stone-100 sm:grid-cols-3">
                {t.hero.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3c999] bg-[#fff7e8] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <a
              href="tel:+351222083456"
              className="flex items-center justify-center gap-2 rounded-md bg-[#201714] px-4 py-3 font-bold text-white"
            >
              <Phone className="size-5 text-[#f2c56b]" />
              {t.cta.call}
            </a>
            <a
              href={restaurant.whatsappHref}
              className="flex items-center justify-center gap-2 rounded-md bg-[#2d6a4f] px-4 py-3 font-bold text-white"
            >
              <Send className="size-5" />
              {t.cta.whatsapp}
            </a>
            <a
              href={restaurant.mapsHref}
              className="flex items-center justify-center gap-2 rounded-md bg-[#b73323] px-4 py-3 font-bold text-white"
            >
              <MapPin className="size-5" />
              {t.cta.maps}
            </a>
            <Link
              href={localizedHref("/menu", locale)}
              className="flex items-center justify-center gap-2 rounded-md bg-[#f2c56b] px-4 py-3 font-bold text-[#201714] sm:col-span-3 lg:col-span-1"
            >
              <Utensils className="size-5" />
              {t.cta.menu}
            </Link>
          </div>
        </section>

        <section id="especialidades" className="bg-[#fff7e8] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow={t.sections.specialtiesEyebrow}
              title={t.sections.specialtiesTitle}
              body={t.sections.specialtiesBody}
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden border-[#e3c999] bg-[#fffaf0] shadow-sm">
                  {item.image ? (
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black text-[#251a16]">{item.name}</h3>
                      {item.price ? <Badge className="bg-[#f2c56b] text-[#251a16]">{item.price}</Badge> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#624f42]">{item.description[locale]}</p>
                    <Link
                      href={localizedHref(`/menu#${item.category}`, locale)}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#b73323] underline-offset-4 hover:underline"
                    >
                      {t.common.viewFullMenu}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#2a1d18] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionIntro
              eyebrow={t.sections.menuEyebrow}
              title={t.sections.menuTitle}
              body={t.sections.menuBody}
              inverse
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {previewCategories.map((category) => {
                const count = menuItems.filter((item) => item.category === category.id).length;

                return (
                  <Link
                    key={category.id}
                    href={localizedHref(`/menu#${category.id}`, locale)}
                    className="rounded-md border border-white/10 bg-white/8 p-5 transition hover:-translate-y-1 hover:bg-white/12"
                  >
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#f2c56b]">
                      {count} itens
                    </span>
                    <h3 className="mt-3 text-2xl font-black">{category.label[locale]}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="avaliacoes" className="bg-[#fff7e8] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <SectionIntro
              eyebrow={t.sections.reviewsEyebrow}
              title={t.sections.reviewsTitle}
              body={t.sections.reviewsBody}
            />
            <ReviewsCarousel reviews={reviews} />
          </div>
        </section>

        <section id="sobre" className="bg-[#fbecd1] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionIntro
                eyebrow={t.sections.aboutEyebrow}
                title={t.sections.aboutTitle}
                body={t.sections.aboutBody}
              />
            </div>
            <div className="grid gap-4">
              {[
                { icon: Utensils, title: "Churrasco", body: "Grelhados e pratos portugueses." },
                { icon: ShoppingBag, title: "Take-away", body: "CTAs rapidos para encomendas." },
                { icon: ShieldCheck, title: "Dados editaveis", body: "Conteudo separado em ficheiros locais." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-md border border-[#e3c999] bg-[#fffaf0] p-5">
                    <Icon className="size-6 text-[#b73323]" />
                    <h3 className="mt-4 font-black">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#624f42]">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#fff7e8] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow={t.sections.galleryEyebrow}
              title={t.sections.galleryTitle}
              body={restaurant.heroImage.source}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <figure key={image.id} className="overflow-hidden rounded-md bg-[#251a16]">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={image.src}
                      alt={image.alt[locale]}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-95"
                    />
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="localizacao" className="bg-[#201714] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionIntro
                eyebrow={t.sections.locationEyebrow}
                title={t.sections.locationTitle}
                body={t.sections.locationBody}
                inverse
              />
              <div className="mt-8 grid gap-4 text-stone-100">
                <InfoRow icon={MapPin} label={t.common.address} value={restaurant.canonicalAddress} />
                <InfoRow icon={Phone} label={t.common.phone} value={restaurant.canonicalPhone} />
                <InfoRow
                  icon={Clock}
                  label={t.common.hours}
                  value={restaurant.openingHours.map((item) => item.label).join(" · ")}
                />
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-[#f2c56b] text-[#201714] hover:bg-[#ffd982]">
                  <a href={restaurant.mapsHref}>{t.common.directions}</a>
                </Button>
                <Button asChild className="bg-[#2d6a4f] text-white hover:bg-[#35845f]">
                  <a href={restaurant.whatsappHref}>{t.common.whatsapp}</a>
                </Button>
              </div>
            </div>
            <div className="min-h-[420px] overflow-hidden rounded-md border border-white/10 bg-white/10">
              <iframe
                title="Mapa da Churrasqueira Paraiso do Porto"
                src={restaurant.mapsEmbed}
                className="h-full min-h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#140f0d] px-4 py-8 pb-24 text-sm text-stone-400 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{restaurant.name}</p>
          <p>{t.footer}</p>
        </div>
      </footer>
      <MobileBottomBar locale={locale} />
    </>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={
          inverse
            ? "text-sm font-black uppercase tracking-[0.18em] text-[#f2c56b]"
            : "text-sm font-black uppercase tracking-[0.18em] text-[#b73323]"
        }
      >
        {eyebrow}
      </p>
      <h2
        className={
          inverse
            ? "mt-3 text-4xl font-black leading-tight text-white sm:text-5xl"
            : "mt-3 text-4xl font-black leading-tight text-[#251a16] sm:text-5xl"
        }
      >
        {title}
      </h2>
      <p className={inverse ? "mt-5 text-lg leading-8 text-stone-200" : "mt-5 text-lg leading-8 text-[#624f42]"}>
        {body}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-md border border-white/10 bg-white/8 p-4">
      <Icon className="mt-1 size-5 shrink-0 text-[#f2c56b]" />
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-stone-400">{label}</p>
        <p className="mt-1 font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
