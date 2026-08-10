export type Locale = "pt" | "en" | "es";

export type VerifiedStatus = "client-provided" | "verified" | "conflict" | "unverified";

export type DeliveryLink = {
  label: string;
  href: string;
  status: VerifiedStatus;
  note: string;
};

export type ContactAction = {
  label: string;
  href: string;
  status: VerifiedStatus;
};

export type RestaurantInfo = {
  name: string;
  shortName: string;
  canonicalAddress: string;
  canonicalPhone: string;
  whatsappHref: string;
  mapsHref: string;
  mapsEmbed: string;
  cuisine: string[];
  priceRange: string;
  publicIdentityNote: string;
  verifiedListing?: {
    name: string;
    address: string;
    phone: string;
    url: string;
  };
  openingHours: {
    label: string;
    status: VerifiedStatus;
  }[];
  heroImage: {
    src: string;
    alt: string;
    source: string;
  };
};

export const restaurant: RestaurantInfo = {
  name: "Churrasqueira Paraíso do Porto",
  shortName: "Paraíso do Porto",
  canonicalAddress: "Rua do Paraíso 230, Porto, Portugal",
  canonicalPhone: "+351 222 083 456",
  whatsappHref: "https://wa.me/351222083456",
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Rua%20do%20Para%C3%ADso%20230%2C%20Porto%2C%20Portugal",
  mapsEmbed:
    "https://www.google.com/maps?q=Rua%20do%20Para%C3%ADso%20230%2C%20Porto%2C%20Portugal&output=embed",
  cuisine: ["Portuguese", "Churrasqueira", "Take-away", "Grill"],
  priceRange: "€€",
  publicIdentityNote:
    "Os dados principais abaixo seguem a morada e telefone fornecidos pelo cliente. A pesquisa pública encontrou uma ficha muito semelhante em Rua do Paraíso 246/248 com outro telefone, por isso links e avaliações dessa ficha ficam separados até confirmação manual.",
  verifiedListing: {
    name: "Churrasqueira Paraíso / Churrasqueira Paraíso 1",
    address: "Rua do Paraíso 246/248, Porto, Portugal",
    phone: "+351 22 205 7135",
    url: "https://pt.restaurantguru.com/restaurante-paraiso-Porto-3",
  },
  openingHours: [
    { label: "Terça a domingo: 12:00-15:00 e 19:00-22:30", status: "conflict" },
    { label: "Segunda-feira: a confirmar", status: "unverified" },
  ],
  heroImage: {
    src: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1800&q=80",
    alt: "Frango grelhado com batatas e legumes numa mesa familiar",
    source: "Unsplash placeholder; replace with licensed restaurant photo before production.",
  },
};

export const primaryContactActions: ContactAction[] = [
  {
    label: "Ligar agora",
    href: "tel:+351222083456",
    status: "client-provided",
  },
  {
    label: "Enviar WhatsApp",
    href: restaurant.whatsappHref,
    status: "client-provided",
  },
  {
    label: "Como chegar",
    href: restaurant.mapsHref,
    status: "client-provided",
  },
];
