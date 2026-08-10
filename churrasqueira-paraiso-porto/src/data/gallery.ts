import type { Locale, VerifiedStatus } from "@/data/restaurant";

export type GalleryImage = {
  id: string;
  category: "food" | "exterior" | "interior" | "menu";
  src: string;
  alt: Record<Locale, string>;
  source: string;
  permissionStatus: "stock-license" | "public-listing" | "needs-permission";
  identityStatus: VerifiedStatus;
};

export const galleryImages: GalleryImage[] = [
  {
    id: "grill-table",
    category: "food",
    src: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80",
    alt: {
      pt: "Mesa com frango grelhado e acompanhamentos",
      en: "Table with grilled chicken and sides",
      es: "Mesa con pollo a la brasa y guarniciones",
    },
    source: "Unsplash placeholder photo",
    permissionStatus: "stock-license",
    identityStatus: "unverified",
  },
  {
    id: "ribs",
    category: "food",
    src: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    alt: {
      pt: "Costelinhas grelhadas com molho",
      en: "Grilled ribs with sauce",
      es: "Costillas a la parrilla con salsa",
    },
    source: "Unsplash placeholder photo",
    permissionStatus: "stock-license",
    identityStatus: "unverified",
  },
  {
    id: "counter",
    category: "interior",
    src: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    alt: {
      pt: "Interior acolhedor de restaurante local",
      en: "Warm local restaurant interior",
      es: "Interior acogedor de restaurante local",
    },
    source: "Unsplash placeholder photo",
    permissionStatus: "stock-license",
    identityStatus: "unverified",
  },
  {
    id: "porto-street",
    category: "exterior",
    src: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
    alt: {
      pt: "Rua tradicional no Porto",
      en: "Traditional street in Porto",
      es: "Calle tradicional en Oporto",
    },
    source: "Unsplash placeholder photo",
    permissionStatus: "stock-license",
    identityStatus: "unverified",
  },
];
