interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "brand" | "gold" | "none";
}

export function Card({ title, children, className = "", accent = "none" }: CardProps) {
  const accentBar =
    accent === "brand"
      ? "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-brand-gradient"
      : accent === "gold"
      ? "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-gold-gradient"
      : "";

  return (
    <section
      className={[
        "relative rounded-2xl border border-pitch-500 bg-pitch-800 shadow-card",
        accent !== "none" ? "pl-5 " + accentBar : "p-4",
        accent !== "none" ? "pr-4 py-4" : "",
        className,
      ].join(" ")}
    >
      {title && (
        <h2 className="mb-3 text-base font-semibold text-pitch-50">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
