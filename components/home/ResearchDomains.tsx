import Link from "next/link";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";

import { researchDomains } from "@/lib/domains/domainConfig";

export default function ResearchDomains() {
  return (
    <section
      id="research-domains"
      className="relative overflow-hidden bg-[#020712] px-6 pt-16 pb-24 text-white"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute bottom-0 right-[12%] h-80 w-80 rounded-full bg-amber-400/[0.05] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
            <Sparkles className="h-4 w-4" />
            منصة متعددة التخصصات
          </span>

          <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
            التخصصات التي
            <span className="mt-2 block bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent">
              يدعمها أثر
            </span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            يبدأ أثر بالبحث التاريخي، ثم تتوسع المنصة تدريجيًا لدعم مجالات
            العلوم الإنسانية المختلفة داخل بيئة بحثية واحدة.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {researchDomains.map((domain, index) => {
            const DomainIcon = domain.icon;

            return (
              <article
                key={domain.id}
                className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition duration-300 ${
                  domain.enabled
                    ? "border-blue-400/20 bg-[#061225]/80 hover:-translate-y-1.5 hover:border-blue-300/50 hover:shadow-[0_22px_60px_rgba(15,64,140,.18)]"
                    : "border-white/10 bg-slate-900/60"
                }`}
              >
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/35 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                      domain.enabled
                        ? "border-blue-400/30 bg-blue-500/10 text-blue-300 group-hover:border-amber-300/35 group-hover:text-amber-300"
                        : "border-white/10 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <DomainIcon className="h-6 w-6" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-white/[0.04]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

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
                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  {domain.name}
                </h3>

                <p className="mt-3 min-h-20 leading-7 text-slate-400">
                  {domain.description}
                </p>

                {domain.enabled ? (
                  <div className="mt-6">
                    <div className="mb-5 flex flex-wrap gap-2">
                      {domain.entityTypes.slice(0, 4).map((entityType) => (
                        <span
                          key={entityType.id}
                          className="rounded-full border border-blue-400/10 bg-blue-500/[0.05] px-3 py-1 text-xs text-slate-300"
                        >
                          {entityType.pluralLabel}
                        </span>
                      ))}
                    </div>

                    <Link
                      href="/projects/new"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-5 py-3 font-bold text-slate-950 shadow-[0_12px_30px_rgba(216,165,59,.18)] transition hover:brightness-110"
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