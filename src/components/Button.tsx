import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-glow hover:opacity-90 active:opacity-80",
  secondary:
    "border border-pitch-500 bg-pitch-700 text-pitch-100 hover:bg-pitch-600 hover:border-pitch-400 active:bg-pitch-700",
  ghost:
    "bg-transparent text-pitch-200 hover:bg-pitch-700 hover:text-pitch-50 active:bg-pitch-600",
  danger:
    "bg-red-600/90 text-white hover:bg-red-600 active:bg-red-700",
  gold:
    "bg-gold-gradient text-pitch-950 font-bold shadow-gold hover:opacity-90 active:opacity-80",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-500 focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-900",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
