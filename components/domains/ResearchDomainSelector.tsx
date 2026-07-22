"use client";

import { CheckCircle2, Lock } from "lucide-react";

import {
  researchDomains,
  type ResearchDomain,
} from "@/lib/domains/domainConfig";

type Props = {
  value?: ResearchDomain["id"];
  onChange?: (domain: ResearchDomain) => void;
};

export default function ResearchDomainSelector({
  value = "history",
  onChange,
}: Props) {
  return (
    <section
      className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl md:p-8"
      aria-labelledby="research-domain-title"
    >
      <div>
        <h2
          id="research-domain-title"
          className="text-2xl font-bold text-white"
        >
          اختر مجال البحث
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-400">
          يدعم أثر حاليًا مجال التاريخ، وستُضاف بقية تخصصات
          العلوم الإنسانية تدريجيًا.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {researchDomains.map((domain) => {
          const DomainIcon = domain.icon;
          const selected = value === domain.id;
          const disabled = !domain.enabled;

          return (
            <button
              key={domain.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  onChange?.(domain);
                }
              }}
              className={`rounded-2xl border p-5 text-right transition ${
                selected
                  ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-950/20"
                  : "border-white/10 bg-slate-800/70"
              } ${
                disabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-slate-700/70 text-slate-300"
                  }`}
                >
                  <DomainIcon className="h-6 w-6" />
                </div>

                {domain.enabled ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    متاح الآن
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                    <Lock className="h-4 w-4" />
                    قريبًا
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                {domain.name}
              </h3>

              <p className="mt-2 min-h-14 text-sm leading-7 text-slate-400">
                {domain.description}
              </p>

              {selected && domain.enabled && (
                <div className="mt-4 border-t border-amber-400/20 pt-4 text-sm font-semibold text-amber-300">
                  المجال المختار
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}