import Link from "next/link";
import {
  ArrowLeft,
  BookCheck,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const benefits = [
  "تصحيح الأخطاء اللغوية والإملائية",
  "تحسين الصياغة والأسلوب الأكاديمي",
  "الحفاظ على المعنى والمراجع والاقتباسات",
  "دعم ملفات Word وPDF",
];

export default function AcademicReviewPromo() {
  return (
    <section
      id="academic-review"
      dir="rtl"
      className="relative overflow-hidden border-y border-amber-400/10 bg-[#030a16] py-14 text-white md:py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-amber-400/[0.08] blur-[110px]" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.045] bg-[linear-gradient(rgba(251,191,36,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.06)_1px,transparent_1px)] bg-[size:58px_58px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-8 px-5 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-4 py-2 text-sm font-bold text-amber-300">
            <BookCheck className="h-4 w-4" />
            أداة متخصصة للباحثين
          </div>

          <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.35] sm:text-4xl lg:text-5xl">
            المراجعة اللغوية والأكاديمية
            <span className="block bg-gradient-to-l from-[#ffe59a] via-[#efb13d] to-[#c97714] bg-clip-text text-transparent">
              للرسائل العلمية
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 md:text-lg md:leading-9">
            ارفعي رسالتك العلمية، ودعي أثر يصحّح اللغة والإملاء ويحسّن الصياغة
            الأكاديمية، مع الحفاظ على المعنى العلمي والمراجع والاقتباسات دون تغيير.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/academic-review"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#ffe08a] via-[#e9a62f] to-[#bd6c0d] px-6 py-3.5 font-black text-[#1c1204] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(217,148,32,.18)]"
            >
              ابدئي مراجعة رسالتك
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <span className="inline-flex items-center justify-center gap-2 text-xs text-slate-500 sm:justify-start">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              ملفاتك خاصة ومحفوظة بأمان
            </span>
          </div>
        </div>

        <div className="relative rounded-[28px] border border-white/10 bg-[#071426]/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="absolute -inset-px -z-10 rounded-[28px] bg-gradient-to-br from-amber-400/20 via-transparent to-cyan-400/15 blur-sm" />

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">فصل من رسالة علمية</p>
                <p className="mt-1 text-xs text-slate-500">مقارنة واضحة قبل المراجعة وبعدها</p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 shrink-0 text-amber-300" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-4">
              <p className="mb-3 text-xs font-bold text-red-300">قبل المراجعة</p>
              <p className="text-sm leading-7 text-slate-400">
                تهدف هذه الدراسة الي التعرف علي النتائج التي توصل إليها الباحثون.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4">
              <p className="mb-3 text-xs font-bold text-emerald-300">بعد المراجعة</p>
              <p className="text-sm leading-7 text-slate-200">
                تهدف هذه الدراسة إلى التعرّف على النتائج التي توصّل إليها الباحثون.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
            <p className="text-xs font-bold text-cyan-300">اقتراح أثر</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              تصحيح همزة القطع وتحسين الضبط اللغوي مع الإبقاء على المعنى الأكاديمي للنص.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
