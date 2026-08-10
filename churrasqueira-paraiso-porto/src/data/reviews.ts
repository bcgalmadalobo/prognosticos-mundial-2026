import type { VerifiedStatus } from "@/data/restaurant";

export type Review = {
  reviewer: string;
  rating: number;
  text: string;
  source: string;
  sourceUrl: string;
  date?: string;
  identityStatus: VerifiedStatus;
};

export const reviews: Review[] = [
  {
    reviewer: "MANUEL RT",
    rating: 5,
    text: "Excelente comida, bons colaboradores e competente dono.",
    source: "Google via Restaurant Guru",
    sourceUrl: "https://pt.restaurantguru.com/restaurante-paraiso-Porto-3",
    date: "Junho 2026",
    identityStatus: "conflict",
  },
  {
    reviewer: "Julian W",
    rating: 5,
    text: "The food is fantastic and the service is incredible.",
    source: "Google via Restaurant Guru",
    sourceUrl: "https://pt.restaurantguru.com/restaurante-paraiso-Porto-3",
    date: "2025",
    identityStatus: "conflict",
  },
  {
    reviewer: "b8mb8",
    rating: 5,
    text: "Excelente comida, serviço excelente e preço excelente.",
    source: "Tripadvisor",
    sourceUrl:
      "https://www.tripadvisor.com.br/Restaurant_Review-g189180-d3464202-Reviews-Churrasqueira_Paraiso_1-Porto_Porto_District_Northern_Portugal.html",
    date: "Outubro 2020",
    identityStatus: "conflict",
  },
];

export const aggregateRating = {
  ratingValue: 4.3,
  reviewCount: 2793,
  source: "Google via Restaurant Guru",
  sourceUrl: "https://pt.restaurantguru.com/restaurante-paraiso-Porto-3",
  identityStatus: "conflict" as VerifiedStatus,
};
