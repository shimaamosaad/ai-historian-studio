"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  FilePlus2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "البداية",
    subtitle: "للطلبة والباحثين المستقلين",
    monthlyPrice: "مجانًا",
    yearlyPrice: "مجانًا",
    monthlyPeriod: "",
    yearlyPeriod: "",
    icon: Sparkles,
    featured: false,
    buttonText: "ابدأ الآن مجانًا",
    buttonHref: "/projects/new",
    features: [
      "مشروعان بحثيان",
      "تحليل حتى 25 ملفًا شهريًا ",
      "تحليل أساسي للوثائق",
      "استخراج الشخصيات والأماكن",
      "البحث داخل المستندات",
    ],
  },
  {
    name: "الباقة الاحترافية",
    subtitle: "للأفراد والباحثين والمحترفين",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    monthlyPeriod: "/ شهر",
    yearlyPeriod: "/ سنة",
    icon: Crown,
    featured: true,
    buttonText: "اشترك الآن",
    buttonHref: "/projects/new",
    features: [
      "مشروعات غير محدودة",
      " تحليل حتى 100 ملف شهريًا",
      "إمكانية شراء ملفات إضافية عند الحاجة ",
      "OCR للمستندات الممسوحة ضوئيًا",
      "البحث الذكي داخل الوثائق",
      "الشبكة المعرفية (Knowledge Graph)",
      "التسلسل الزمني للأحداث",
      "تقارير وتحليلات بالذكاء الاصطناعي",
      "أولوية في سرعة المعالجة",
    ],
  },
  {
    name: "المؤسسات",
    subtitle: "للجامعات والمراكز البحثية",
    monthlyPrice: "حسب الطلب",
    yearlyPrice: "حسب الطلب",
    monthlyPeriod: "",
    yearlyPeriod: "",
    icon: Users,
    featured: false,
    buttonText: "تواصل مع فريق المبيعات",
    buttonHref: "#footer",
    features: [
      "حسابات متعددة للفرق",
      "مساحات عمل مشتركة",
      "سعة وأرصدة تحليل أكبر",
      "إعدادات وصلاحيات متقدمة",
      "دعم فني مخصص",
      "خطط مهيأة للمؤسسة",
    ],
  },
];

const creditPacks = [
  {
    credits: "100 ملف إضافي",
    price: "$10",
    label: "مثالية إذا انتهت باقتك الشهرية",
  },
  {
    credits: "500 ملف إضافي",
    price: "$45",
    label: "الأفضل للباحثين النشطين",
    featured: true,
  },
  {
    credits: "1000 ملف إضافي",
    price: "$80",
    label: "للمشروعات البحثية الكبيرة",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const isYearly = billingCycle === "yearly";

  return (
    <section
      id="pricing"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] px-6 py-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[7%] top-16 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[8%] h-96 w-96 rounded-full bg-amber-400/[0.055] blur-[135px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300">
            <Sparkles className="h-4 w-4" />
            باقات مرنة للباحثين
          </span>

          <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
            اختر الباقة
            <span className="mr-3 bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent">
              المناسبة لك
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            ابدأ مجانًا، ثم انتقل إلى الباقة المناسبة عندما يزيد عدد مشروعاتك
            واحتياجاتك البحثية.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="relative inline-flex items-center rounded-2xl border border-blue-400/20 bg-[#071426]/80 p-1.5 shadow-[0_18px_50px_rgba(15,64,140,.16)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 rounded-xl px-5 py-2.5 text-sm font-black transition ${
                  !isYearly
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                شهري
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition ${
                  isYearly
                    ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                سنوي
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    isYearly
                      ? "bg-slate-950/10 text-slate-900"
                      : "bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  وفر 17%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly
              ? plan.yearlyPeriod
              : plan.monthlyPeriod;

            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-7 backdrop-blur-xl transition duration-300 ${
                  plan.featured
                    ? "border-amber-300/55 bg-gradient-to-b from-amber-400/[0.11] via-[#08162a] to-[#061225] shadow-[0_25px_80px_rgba(202,138,4,.15)] lg:-translate-y-3"
                    : "border-blue-400/15 bg-[#061225]/82 hover:-translate-y-2 hover:border-blue-300/40 hover:shadow-[0_22px_60px_rgba(15,64,140,.18)]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-2xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-5 py-2 text-xs font-black text-slate-950 shadow-lg">
                    الأكثر اختيارًا
                  </div>
                )}

                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className={`${plan.featured ? "pt-6" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                        plan.featured
                          ? "border-amber-300/35 bg-amber-400/10 text-amber-300"
                          : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <span className="text-4xl font-black text-white/[0.04]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black">{plan.name}</h3>

                  <p className="mt-2 min-h-[28px] text-sm text-slate-400">
                    {plan.subtitle}
                  </p>

                  <div className="mt-7 flex min-h-[76px] items-end gap-2">
                    <motion.span
                      key={`${plan.name}-${billingCycle}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`font-black ${
                        price.length > 7 ? "text-3xl" : "text-5xl md:text-6xl"
                      }`}
                    >
                      {price}
                    </motion.span>

                    {period && (
                      <motion.span
                        key={`${plan.name}-${billingCycle}-period`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="pb-2 text-sm text-slate-400"
                      >
                        {period}
                      </motion.span>
                    )}
                  </div>

                  {plan.featured && isYearly && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                    >
                      وفّر 38 دولارًا سنويًا
                    </motion.div>
                  )}

                  <div className="mt-7 h-px bg-white/[0.07]" />

                  <ul className="mt-7 space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            plan.featured
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-blue-500/10 text-blue-300"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-8">
                  <Link
                    href={plan.buttonHref}
                    className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 font-black transition ${
                      plan.featured
                        ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 shadow-[0_12px_30px_rgba(216,165,59,.2)] hover:brightness-110"
                        : "border border-blue-400/25 bg-blue-500/[0.07] text-blue-200 hover:border-blue-300/50 hover:bg-blue-500/[0.12]"
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 overflow-hidden rounded-[30px] border border-blue-400/15 bg-gradient-to-b from-[#07172b]/95 to-[#04101f]/95 p-6 shadow-[0_25px_80px_rgba(15,64,140,.14)] md:p-9"
        >
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-right">
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 text-amber-300">
                <FilePlus2 className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <h3 className="text-2xl font-black md:text-3xl">
                    احتجت أرصدة تحليل إضافية؟
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">
                    <Zap className="h-3.5 w-3.5" />
                    بدون تغيير الباقة
                  </span>
                </div>

                <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                  يمكنك شراء أرصدة إضافية في أي وقت ومواصلة العمل فورًا دون
                  انتظار تجدد اشتراكك الشهري.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className={`relative rounded-2xl border p-5 transition hover:-translate-y-1 ${
                  pack.featured
                    ? "border-amber-300/45 bg-amber-400/[0.08]"
                    : "border-blue-400/15 bg-blue-500/[0.045] hover:border-blue-300/35"
                }`}
              >
                {pack.featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-3 py-1 text-[11px] font-black text-slate-950">
                    الأكثر توفيرًا
                  </span>
                )}

                <p className="text-sm font-semibold text-slate-400">
  {pack.credits}
</p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black text-white">
                    {pack.price}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">
                    دفعة واحدة
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-400">{pack.label}</p>

                <Link
                  href="/projects/new"
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition ${
                    pack.featured
                      ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 hover:brightness-110"
                      : "border border-blue-400/20 bg-blue-500/[0.07] text-blue-200 hover:border-blue-300/45 hover:bg-blue-500/[0.12]"
                  }`}
                >
                  شراء الرصيد
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-slate-500">
            الرصيد يُستخدم في تحليل الملفات، وقد تختلف طريقة احتسابه لاحقًا
            وفق حجم الملف ونوع المعالجة المطلوبة.
          </p>
        </motion.div>

        <p className="mt-8 text-center text-sm leading-7 text-slate-500">
          الأسعار الحالية مبدئية ويمكن تعديلها قبل الإطلاق الرسمي وفق تكلفة
          التشغيل والاستخدام الفعلي.
        </p>
      </div>
    </section>
  );
}