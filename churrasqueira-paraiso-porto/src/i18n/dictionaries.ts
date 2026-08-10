import type { Locale } from "@/data/restaurant";

export const locales: Locale[] = ["pt", "en", "es"];

export const localeLabels: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
};

export function normalizeLocale(value?: string): Locale {
  if (value === "en" || value === "es") {
    return value;
  }

  return "pt";
}

export function localizedHref(href: string, locale: Locale) {
  if (locale === "pt") {
    return href;
  }

  const [path, hash] = href.split("#");
  const separator = path.includes("?") ? "&" : "?";
  const localized = `${path}${separator}lang=${locale}`;

  return hash ? `${localized}#${hash}` : localized;
}

export const dictionaries = {
  pt: {
    nav: {
      home: "Início",
      menu: "Menu",
      specialties: "Especialidades",
      reviews: "Avaliações",
      about: "Sobre Nós",
      location: "Localização",
    },
    header: {
      order: "Encomendar agora",
      menuDescription: "Menu, encomendas e localização.",
      callToOrder: "Ligar para encomendar",
    },
    hero: {
      eyebrow: "Churrasqueira portuguesa no Porto",
      title: "Churrasqueira Paraíso do Porto",
      body: "Frango no churrasco, pratos de casa e take-away para refeições familiares, almoços rápidos e jantares sem complicação.",
      call: "Ligar agora",
      menu: "Ver menu",
      directions: "Como chegar",
      chips: ["Rua do Paraíso, Porto", "Take-away e sala", "Comida portuguesa"],
    },
    cta: {
      call: "Ligar",
      whatsapp: "WhatsApp",
      maps: "Google Maps",
      menu: "Ver menu completo",
      noDelivery:
        "Links diretos de delivery ficam ocultos até confirmação da ficha correta do restaurante.",
    },
    sections: {
      specialtiesEyebrow: "Favoritos da casa",
      specialtiesTitle: "Especialidades pensadas para partilhar",
      specialtiesBody:
        "Pratos familiares, grelhados e acompanhamentos clássicos, organizados para facilitar chamadas, take-away e pedidos rápidos.",
      menuEyebrow: "Cardápio digital",
      menuTitle: "Menu fácil de consultar",
      menuBody:
        "Categorias simples, preços quando verificados e notas internas para confirmar dados antes da publicação final.",
      reviewsEyebrow: "Avaliações públicas",
      reviewsTitle: "O que os clientes destacam",
      reviewsBody:
        "Apenas comentários públicos positivos identificados durante a pesquisa. Confirmar a ficha Google correta antes de ativar como site oficial.",
      aboutEyebrow: "Sobre nós",
      aboutTitle: "Uma churrasqueira local, direta e familiar",
      aboutBody:
        "A proposta é simples: comida portuguesa honesta, doses generosas, grelhados com sabor de casa e atendimento pensado para quem quer comer bem sem perder tempo.",
      galleryEyebrow: "Ambiente",
      galleryTitle: "Imagens quentes, familiares e apetitosas",
      locationEyebrow: "Contacto",
      locationTitle: "Passe, ligue ou envie mensagem",
      locationBody:
        "A morada e o telefone abaixo seguem os dados fornecidos pelo cliente. As fontes públicas encontradas devem ser confirmadas antes da versão final.",
    },
    menuPage: {
      eyebrow: "Menu",
      title: "Cardápio para sala, take-away e encomendas",
      body: "Use as categorias para consultar pratos, doses e preços disponíveis nas fontes públicas. Confirme disponibilidade no telefone antes de encomendar.",
      all: "Tudo",
      sourceNote: "Preços e disponibilidade sujeitos a confirmação.",
      popular: "Popular",
      unavailable: "Indisponível",
    },
    common: {
      viewFullMenu: "Ver menu completo",
      call: "Ligar",
      whatsapp: "Enviar WhatsApp",
      directions: "Abrir no Google Maps",
      source: "Fonte",
      phone: "Telefone",
      address: "Morada",
      hours: "Horário",
    },
    footer:
      "Website demo preparado para validação comercial. Confirmar identidade, fotos e plataformas antes de publicar.",
  },
  en: {
    nav: {
      home: "Home",
      menu: "Menu",
      specialties: "Specialties",
      reviews: "Reviews",
      about: "About",
      location: "Location",
    },
    header: {
      order: "Order now",
      menuDescription: "Menu, orders and location.",
      callToOrder: "Call to order",
    },
    hero: {
      eyebrow: "Portuguese grill restaurant in Porto",
      title: "Churrasqueira Paraíso do Porto",
      body: "Grilled chicken, house dishes and take-away for family meals, quick lunches and easy dinners.",
      call: "Call now",
      menu: "View menu",
      directions: "Directions",
      chips: ["Rua do Paraíso, Porto", "Take-away and dining room", "Portuguese food"],
    },
    cta: {
      call: "Call",
      whatsapp: "WhatsApp",
      maps: "Google Maps",
      menu: "Full menu",
      noDelivery:
        "Direct delivery links stay hidden until the correct restaurant listing is confirmed.",
    },
    sections: {
      specialtiesEyebrow: "House favorites",
      specialtiesTitle: "Specialties made for sharing",
      specialtiesBody:
        "Family dishes, grilled food and classic sides, organized for calls, take-away and quick orders.",
      menuEyebrow: "Digital menu",
      menuTitle: "A menu that is easy to scan",
      menuBody:
        "Simple categories, prices where verified, and internal notes for confirmation before final publication.",
      reviewsEyebrow: "Public reviews",
      reviewsTitle: "What customers mention",
      reviewsBody:
        "Only positive public comments found during research. Confirm the correct Google listing before activating as the official site.",
      aboutEyebrow: "About",
      aboutTitle: "A direct, familiar local churrasqueira",
      aboutBody:
        "The offer is simple: honest Portuguese cooking, generous portions, grilled comfort food and service designed for people who want to eat well without wasting time.",
      galleryEyebrow: "Atmosphere",
      galleryTitle: "Warm, familiar and appetizing images",
      locationEyebrow: "Contact",
      locationTitle: "Visit, call or send a message",
      locationBody:
        "The address and phone below follow the client-provided data. Public sources found during research should be confirmed before the final version.",
    },
    menuPage: {
      eyebrow: "Menu",
      title: "Menu for dining, take-away and orders",
      body: "Use the categories to scan dishes, portions and prices available in public sources. Confirm availability by phone before ordering.",
      all: "All",
      sourceNote: "Prices and availability subject to confirmation.",
      popular: "Popular",
      unavailable: "Unavailable",
    },
    common: {
      viewFullMenu: "View full menu",
      call: "Call",
      whatsapp: "Send WhatsApp",
      directions: "Open in Google Maps",
      source: "Source",
      phone: "Phone",
      address: "Address",
      hours: "Hours",
    },
    footer:
      "Demo website prepared for commercial validation. Confirm identity, photos and platforms before publishing.",
  },
  es: {
    nav: {
      home: "Inicio",
      menu: "Menú",
      specialties: "Especialidades",
      reviews: "Reseñas",
      about: "Sobre Nosotros",
      location: "Ubicación",
    },
    header: {
      order: "Pedir ahora",
      menuDescription: "Menú, pedidos y ubicación.",
      callToOrder: "Llamar para pedir",
    },
    hero: {
      eyebrow: "Churrasquería portuguesa en Oporto",
      title: "Churrasqueira Paraíso do Porto",
      body: "Pollo a la brasa, platos de la casa y comida para llevar para comidas familiares, almuerzos rápidos y cenas fáciles.",
      call: "Llamar ahora",
      menu: "Ver menú",
      directions: "Cómo llegar",
      chips: ["Rua do Paraíso, Oporto", "Para llevar y sala", "Comida portuguesa"],
    },
    cta: {
      call: "Llamar",
      whatsapp: "WhatsApp",
      maps: "Google Maps",
      menu: "Ver menú completo",
      noDelivery:
        "Los enlaces directos de delivery quedan ocultos hasta confirmar la ficha correcta.",
    },
    sections: {
      specialtiesEyebrow: "Favoritos de la casa",
      specialtiesTitle: "Especialidades para compartir",
      specialtiesBody:
        "Platos familiares, parrilla y guarniciones clásicas, organizados para llamadas, take-away y pedidos rápidos.",
      menuEyebrow: "Carta digital",
      menuTitle: "Un menú fácil de consultar",
      menuBody:
        "Categorías simples, precios cuando están verificados y notas internas para confirmar antes de publicar.",
      reviewsEyebrow: "Reseñas públicas",
      reviewsTitle: "Lo que destacan los clientes",
      reviewsBody:
        "Solo comentarios públicos positivos encontrados en la investigación. Confirmar la ficha Google correcta antes de activar el sitio oficial.",
      aboutEyebrow: "Sobre nosotros",
      aboutTitle: "Una churrasquería local, directa y familiar",
      aboutBody:
        "La propuesta es sencilla: comida portuguesa honesta, raciones generosas, parrilla con sabor casero y servicio para comer bien sin perder tiempo.",
      galleryEyebrow: "Ambiente",
      galleryTitle: "Imágenes cálidas, familiares y apetitosas",
      locationEyebrow: "Contacto",
      locationTitle: "Visita, llama o envía un mensaje",
      locationBody:
        "La dirección y el teléfono siguen los datos proporcionados por el cliente. Las fuentes públicas deben confirmarse antes de la versión final.",
    },
    menuPage: {
      eyebrow: "Menú",
      title: "Carta para sala, take-away y pedidos",
      body: "Usa las categorías para consultar platos, raciones y precios disponibles en fuentes públicas. Confirma disponibilidad por teléfono antes de pedir.",
      all: "Todo",
      sourceNote: "Precios y disponibilidad sujetos a confirmación.",
      popular: "Popular",
      unavailable: "No disponible",
    },
    common: {
      viewFullMenu: "Ver menú completo",
      call: "Llamar",
      whatsapp: "Enviar WhatsApp",
      directions: "Abrir en Google Maps",
      source: "Fuente",
      phone: "Teléfono",
      address: "Dirección",
      hours: "Horario",
    },
    footer:
      "Sitio demo preparado para validación comercial. Confirmar identidad, fotos y plataformas antes de publicar.",
  },
} as const;
