import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
