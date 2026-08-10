import type { Locale, VerifiedStatus } from "@/data/restaurant";

export type MenuCategory =
  | "entradas"
  | "sopas"
  | "peixe"
  | "carne"
  | "churrasco"
  | "guarnicoes"
  | "sobremesas"
  | "bebidas";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  description: Record<Locale, string>;
  price?: string;
  portion?: string;
  image?: string;
  source: string;
  sourceStatus: VerifiedStatus;
  popular?: boolean;
  available: boolean;
};

export const menuCategories: { id: MenuCategory; label: Record<Locale, string> }[] = [
  { id: "entradas", label: { pt: "Entradas", en: "Starters", es: "Entrantes" } },
  { id: "sopas", label: { pt: "Sopas", en: "Soups", es: "Sopas" } },
  { id: "peixe", label: { pt: "Peixe", en: "Fish", es: "Pescado" } },
  { id: "carne", label: { pt: "Carne", en: "Meat", es: "Carne" } },
  { id: "churrasco", label: { pt: "Churrasco", en: "Grill", es: "Parrilla" } },
  { id: "guarnicoes", label: { pt: "Guarnições", en: "Sides", es: "Guarniciones" } },
  { id: "sobremesas", label: { pt: "Sobremesas", en: "Desserts", es: "Postres" } },
  { id: "bebidas", label: { pt: "Bebidas", en: "Drinks", es: "Bebidas" } },
];

export const menuItems: MenuItem[] = [
  {
    id: "alheira",
    name: "Alheira",
    category: "entradas",
    description: {
      pt: "Enchido tradicional de carnes e pão, temperado com alho.",
      en: "Traditional Portuguese sausage with meat, bread and garlic.",
      es: "Embutido tradicional de carne, pan y ajo.",
    },
    price: "7,50 €",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "espetada-chourico",
    name: "Espetada de Chouriço",
    category: "entradas",
    description: {
      pt: "Chouriço fatiado e grelhado, ideal para partilhar.",
      en: "Sliced grilled chorizo, made for sharing.",
      es: "Chorizo a la parrilla para compartir.",
    },
    price: "6,50 €",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "misto-paraiso",
    name: "Entrada Misto à Paraíso",
    category: "entradas",
    description: {
      pt: "Seleção mista de entradas da casa para mesa familiar.",
      en: "House selection of starters for the table.",
      es: "Selección de entrantes de la casa para compartir.",
    },
    price: "20,00 €",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "caldo-verde",
    name: "Caldo Verde",
    category: "sopas",
    description: {
      pt: "Sopa tradicional de batata, couve-galega e chouriço.",
      en: "Classic potato, kale and chorizo soup.",
      es: "Sopa clásica de patata, col gallega y chorizo.",
    },
    price: "4,00 €",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "canja",
    name: "Canja de Galinha",
    category: "sopas",
    description: {
      pt: "Sopa caseira de galinha com arroz.",
      en: "Homestyle chicken soup with rice.",
      es: "Sopa casera de pollo con arroz.",
    },
    price: "4,00 €",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "bacalhau",
    name: "Bacalhau",
    category: "peixe",
    description: {
      pt: "Prato de peixe português mencionado em fontes públicas.",
      en: "Portuguese cod dish mentioned by public listings.",
      es: "Plato portugués de bacalao citado en fuentes públicas.",
    },
    source: "Restaurant Guru frequently mentioned dishes",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "filetes-pescada",
    name: "Filetes de Pescada",
    category: "peixe",
    description: {
      pt: "Filetes de peixe de sabor familiar, servidos com guarnições.",
      en: "Familiar fish fillets served with sides.",
      es: "Filetes de pescado servidos con guarniciones.",
    },
    source: "Prompt candidate; needs menu confirmation",
    sourceStatus: "unverified",
    available: true,
  },
  {
    id: "rosbife-inglesa",
    name: "Rosbife à Inglesa",
    category: "carne",
    description: {
      pt: "Especialidade de carne com dose generosa para partilhar.",
      en: "Generous beef specialty made for sharing.",
      es: "Especialidad de carne en ración generosa para compartir.",
    },
    price: "52,00 €",
    portion: "1 dose = 3 pax",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "meio-rosbife",
    name: "1/2 Rosbife à Inglesa",
    category: "carne",
    description: {
      pt: "Meia dose de rosbife para duas pessoas.",
      en: "Half portion of roast beef for two people.",
      es: "Media ración de rosbife para dos personas.",
    },
    price: "35,10 €",
    portion: "1/2 dose = 2 pax",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "francesinha-especial",
    name: "Francesinha Especial",
    category: "carne",
    description: {
      pt: "Sanduíche de carnes e enchidos com queijo e molho de francesinha.",
      en: "Meat and sausage sandwich with melted cheese and francesinha sauce.",
      es: "Sándwich de carnes y embutidos con queso y salsa francesinha.",
    },
    price: "29,90 €",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "vitela-assada",
    name: "Vitela Assada",
    category: "carne",
    description: {
      pt: "Vitela assada em dose familiar.",
      en: "Roast veal in a family-size portion.",
      es: "Ternera asada en ración familiar.",
    },
    price: "52,00 €",
    portion: "1 dose = 3 pax",
    source: "Uber Eats listing for Churrasqueira Paraíso, Rua do Paraíso 248",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "frango-churrasco",
    name: "Frango no Churrasco",
    category: "churrasco",
    description: {
      pt: "Frango grelhado no carvão, simples, familiar e pronto para levar.",
      en: "Charcoal-grilled chicken, familiar and ready for take-away.",
      es: "Pollo a la brasa, familiar y listo para llevar.",
    },
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    source: "Public listing category and review mentions",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "costelinhas",
    name: "Costelinhas",
    category: "churrasco",
    description: {
      pt: "Costelinhas grelhadas com acompanhamento de casa.",
      en: "Grilled ribs with house sides.",
      es: "Costillas a la parrilla con acompañamiento.",
    },
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    source: "Prompt candidate and public photo captions",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "picanha",
    name: "Picanha",
    category: "churrasco",
    description: {
      pt: "Carne grelhada para partilhar com arroz, feijão e batata.",
      en: "Grilled beef to share with rice, beans and chips.",
      es: "Carne a la parrilla para compartir con arroz, alubias y patatas.",
    },
    source: "Tripadvisor review mentions picanha",
    sourceStatus: "conflict",
    popular: true,
    available: true,
  },
  {
    id: "arroz",
    name: "Arroz",
    category: "guarnicoes",
    description: {
      pt: "Acompanhamento clássico para churrasco e pratos de carne.",
      en: "Classic side for grilled chicken and meat dishes.",
      es: "Guarnición clásica para parrilla y carnes.",
    },
    source: "Restaurant Guru frequently mentioned dishes",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "batata-frita",
    name: "Batata Frita",
    category: "guarnicoes",
    description: {
      pt: "Batata frita para completar a dose.",
      en: "Chips to round out the portion.",
      es: "Patatas fritas para completar la ración.",
    },
    source: "Public review mentions",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "feijao-preto",
    name: "Feijão Preto",
    category: "guarnicoes",
    description: {
      pt: "Feijão preto para acompanhar carnes grelhadas.",
      en: "Black beans for grilled meat dishes.",
      es: "Alubias negras para carnes a la parrilla.",
    },
    source: "Tripadvisor photo caption and prompt candidate",
    sourceStatus: "conflict",
    available: true,
  },
  {
    id: "sobremesa-casa",
    name: "Sobremesa da Casa",
    category: "sobremesas",
    description: {
      pt: "Seleção doce sujeita à disponibilidade do dia.",
      en: "Sweet selection subject to daily availability.",
      es: "Selección dulce según disponibilidad del día.",
    },
    source: "Generic restaurant menu slot; confirm exact desserts",
    sourceStatus: "unverified",
    available: true,
  },
  {
    id: "vinho-casa",
    name: "Vinho da Casa",
    category: "bebidas",
    description: {
      pt: "Bebida clássica para acompanhar pratos portugueses.",
      en: "Classic pairing for Portuguese dishes.",
      es: "Acompañamiento clásico para platos portugueses.",
    },
    source: "Restaurant Guru mentions port wine and sangria",
    sourceStatus: "conflict",
    available: true,
  },
];

export const popularMenuItems = menuItems.filter((item) => item.popular);
