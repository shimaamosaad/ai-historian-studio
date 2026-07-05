"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AtharInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const AtharInput = forwardRef<HTMLInputElement, AtharInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          {...props}
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition-all duration-300",
            "placeholder:text-slate-500",
            "focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
        />

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AtharInput.displayName = "AtharInput";

export default AtharInput;