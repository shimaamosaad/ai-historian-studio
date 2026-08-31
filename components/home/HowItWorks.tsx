"use client";

import { motion } from "framer-motion";
import {
  FolderPlus,
  Upload,
  BrainCircuit,
  BarChart3,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: FolderPlus,
    title: "أنشئ مشروعًا",
    text: "ابدأ مشروعًا جديدًا وحدد موضوع البحث أو الفترة التاريخية التي تعمل عليها.",
  },
  {
    icon: Upload,
    title: "أضف المصادر",
    text: "ارفع الكتب والمخطوطات والوثائق والصور ليبدأ النظام في معالجتها.",
  },
  {
    icon: BrainCircuit,
    title: "تحليل بالذكاء الاصطناعي",
    text: "يستخرج أثر الشخصيات والأماكن والأحداث والعلاقات ويحلل المحتوى تلقائيًا.",
  },
  {
    icon: BarChart3,
    title: "نتائج تفاعلية",
    text: "استكشف التقارير والشبكات المعرفية والخطوط الزمنية في واجهة واحدة.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] px-4 py-14 text-white sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-10 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute bottom-[-80px] right-[10%] h-80 w-80 rounded-full bg-amber-400/[0.05] blur-[120px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={false}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-14 lg:mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 sm:px-5 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            آلية العمل
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight sm:mt-6 sm:text-4xl md:text-5xl">
            كيف يعمل
            <span className="mr-2 bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent sm:mr-3">
              أثر؟
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:mt-5 sm:text-base sm:leading-8 lg:mt-6 lg:text-lg">
            رحلة بحثية بسيطة تبدأ من إنشاء المشروع ورفع المصادر،
            وتنتهي بنتائج مترابطة وتقارير تساعدك على فهم المحتوى
            بسرعة ووضوح.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-[72px] hidden h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent lg:block" />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.title}
                  initial={false}
                  className="group relative overflow-visible"
                >
                  <div className="relative h-full overflow-hidden rounded-[26px] border border-blue-400/15 bg-[#061225]/80 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-blue-300/45 hover:shadow-[0_22px_60px_rgba(15,64,140,.2)] sm:p-6 lg:p-7">
                    <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                    <div className="flex items-start justify-between gap-4">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-blue-300 shadow-[0_12px_28px_rgba(37,99,235,.14)] transition duration-300 group-hover:border-amber-300/40 group-hover:text-amber-300 sm:h-16 sm:w-16">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />

                        <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#020712] bg-gradient-to-br from-[#f5d27a] to-[#c97a17] text-xs font-black text-slate-950">
                          {index + 1}
                        </span>
                      </div>

                      <span className="text-4xl font-black text-white/[0.04] sm:text-5xl">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-black leading-8 text-white sm:mt-6 sm:text-2xl lg:mt-7">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-400 sm:mt-4 sm:text-base sm:leading-8 lg:min-h-[112px]">
                      {step.text}
                    </p>

                    <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4 sm:mt-6 sm:pt-5">
                      <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.75)]" />

                      <span className="text-xs font-bold tracking-wide text-blue-300">
                        الخطوة {index + 1}
                      </span>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="absolute -left-4 top-[58px] z-20 hidden lg:flex">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/30 bg-[#061225] text-amber-300 shadow-[0_0_18px_rgba(245,194,66,.18)]">
                        <ArrowLeft className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}