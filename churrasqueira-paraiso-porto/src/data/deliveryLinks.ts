import type { DeliveryLink } from "@/data/restaurant";

export const deliveryLinks: DeliveryLink[] = [
  {
    label: "Uber Eats",
    href: "https://www.ubereats.com/pt/store/churrasqueira-paraiso/iRprKyZ3VeybEsSGefPSYg",
    status: "conflict",
    note: "Ficha publica para Rua do Paraíso 248; nao mostrar como link oficial ate confirmacao.",
  },
  {
    label: "Bolt Food",
    href: "https://food.bolt.eu/en/437-porto/p/61559-churrasqueira-porto-paraiso-ll/",
    status: "conflict",
    note: "Resultado publico relacionado a Churrasqueira Porto Paraíso II; confirmar entidade.",
  },
  {
    label: "Glovo",
    href: "",
    status: "unverified",
    note: "Nao foi encontrado link direto confirmado para a entidade exata.",
  },
];

export const verifiedDeliveryLinks = deliveryLinks.filter((link) => link.status === "verified");
