import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "cta" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-btn px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent text-white hover:bg-accentDark focus:ring-accent",
        variant === "cta" && "bg-cta text-white shadow-sm hover:bg-ctaDark focus:ring-cta",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-surface focus:ring-accent",
        variant === "ghost" && "text-ink hover:bg-surface focus:ring-accent",
        variant === "danger" && "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-400",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
