import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";

import { researchDomains } from "@/lib/domains/domainConfig";

export default function ResearchDomains() {
  return (
    <section
  id="research-domains"
  className="bg-slate-950 px-6 py-24 text-white"
  dir="rtl"
>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300">
            منصة متعددة التخصصات
          </span>

          <h2 className="mt-6 text-4xl font-black md:text-5xl">
            التخصصات التي يدعمها أثر
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            يبدأ أثر بالبحث التاريخي، ثم تتوسع المنصة تدريجيًا
            لدعم مجالات العلوم الإنسانية المختلفة.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {researchDomains.map((domain) => {
            const DomainIcon = domain.icon;

            return (
              <article
                key={domain.id}
                className={`relative overflow-hidden rounded-3xl border p-6 transition ${
                  domain.enabled
                    ? "border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-slate-900 hover:-translate-y-1 hover:border-amber-300"
                    : "border-white/10 bg-slate-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      domain.enabled
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-slate-800 text-slate-400"
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
                    <span className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                      <Lock className="h-4 w-4" />
                      قريبًا
                    </span>
                  )}
                </div>

                <h3 className="mt-6 text-2xl font-bold">
                  {domain.name}
                </h3>

                <p className="mt-3 min-h-20 leading-7 text-slate-400">
                  {domain.description}
                </p>

                {domain.enabled ? (
                  <div className="mt-6">
                    <div className="mb-5 flex flex-wrap gap-2">
                      {domain.entityTypes
                        .slice(0, 4)
                        .map((entityType) => (
                          <span
                            key={entityType.id}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                          >
                            {entityType.pluralLabel}
                          </span>
                        ))}
                    </div>

                    <Link
                      href="/projects/new"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300"
                    >
                      ابدأ مشروعًا تاريخيًا
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-500">
                    سيُضاف هذا التخصص في مرحلة لاحقة.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}