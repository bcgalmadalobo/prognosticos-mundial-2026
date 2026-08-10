"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

import type { Review } from "@/data/reviews";

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % reviews.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [reviews.length]);

  const review = reviews[index];

  return (
    <div className="relative overflow-hidden rounded-md border border-[#e3c999] bg-[#fffaf0] p-6 shadow-sm">
      <AnimatePresence mode="wait">
        <motion.figure
          key={review.reviewer}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="min-h-48"
        >
          <div className="flex gap-1 text-[#c9891f]" aria-label={`${review.rating} estrelas`}>
            {Array.from({ length: review.rating }).map((_, starIndex) => (
              <Star key={starIndex} className="size-5 fill-current" />
            ))}
          </div>
          <blockquote className="mt-5 text-2xl font-bold leading-snug text-[#251a16]">
            {`"${review.text}"`}
          </blockquote>
          <figcaption className="mt-6">
            <span className="block font-semibold text-[#251a16]">{review.reviewer}</span>
            <a
              href={review.sourceUrl}
              className="text-sm italic text-[#6f5b4b] underline-offset-4 hover:underline"
            >
              {review.source}
              {review.date ? `, ${review.date}` : ""}
            </a>
          </figcaption>
        </motion.figure>
      </AnimatePresence>
      <div className="mt-4 flex gap-2">
        {reviews.map((item, itemIndex) => (
          <button
            key={item.reviewer}
            type="button"
            aria-label={`Mostrar avaliacao de ${item.reviewer}`}
            className={
              itemIndex === index
                ? "h-2.5 w-8 rounded-full bg-[#b73323]"
                : "h-2.5 w-2.5 rounded-full bg-[#d8c2a0]"
            }
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </div>
  );
}
