"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AtharButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export default function AtharButton({
  children,
  className,
  variant = "primary",
  ...props
}: AtharButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20",

    secondary:
      "bg-slate-800 text-white border border-white/10 hover:bg-slate-700",

    ghost:
      "bg-transparent border border-white/10 text-slate-300 hover:bg-slate-800",

    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}