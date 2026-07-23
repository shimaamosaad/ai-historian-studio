"use client";

import Link from "next/link";
import { ArrowLeft, PlayCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section
      id="cta"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] px-6 py-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-8 h-80 w-80 rounded-full bg-blue-500/12 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[10%] h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.07]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="relative z-10 mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-blue-400/20 bg-gradient-to-br from-[#08182d]/95 via-[#061326]/95 to-[#07101d]/95 px-7 py-14 text-center shadow-[0_30px_100px_rgba(15,64,140,.18)] backdrop-blur-xl md:px-12 md:py-20"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-5 py-2 text-sm font-black text-amber-300">
            <Sparkles className="h-4 w-4" />
            ابدأ مشروعك البحثي الآن
          </span>

          <h2 className="mt-7 text-4xl font-black leading-tight md:text-6xl">
            حوّل وثائقك التاريخية إلى
            <span className="mr-3 bg-gradient-to-l from-[#ffe7a4] via-[#efbd55] to-[#cf821d] bg-clip-text text-transparent">
              معرفة قابلة للاستكشاف
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">
            ارفع أول وثيقة خلال دقائق، ودع منصة أثر تساعدك في تحليل المحتوى،
            واستخراج الشخصيات والأحداث، وبناء شبكة معرفية وتقارير تاريخية
            منظمة.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/projects/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-7 py-4 font-black text-slate-950 shadow-[0_14px_35px_rgba(216,165,59,.22)] transition hover:-translate-y-1 hover:brightness-110 sm:w-auto"
            >
              ابدأ مجانًا
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/[0.07] px-7 py-4 font-black text-blue-200 transition hover:-translate-y-1 hover:border-blue-300/50 hover:bg-blue-500/[0.12] sm:w-auto"
            >
              <PlayCircle className="h-5 w-5" />
              شاهد كيف تعمل المنصة
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
            <span>بدون بطاقة ائتمانية</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
            <span>يمكنك الترقية في أي وقت</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
            <span>بياناتك محفوظة وآمنة</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}