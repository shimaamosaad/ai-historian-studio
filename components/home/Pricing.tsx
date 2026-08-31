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

import PaddleCheckoutButton, {
  type PurchaseType,
} from "@/components/payments/PaddleCheckoutButton";

type Plan = {
  name: string;
  subtitle: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPeriod: string;
  yearlyPeriod: string;
  icon: typeof Sparkles;
  featured: boolean;
  buttonText: string;
  buttonHref?: string;
  isPaid?: boolean;
  monthlyPurchaseType?: PurchaseType;
  yearlyPurchaseType?: PurchaseType;
  features: string[];
};

type CreditPack = {
  credits: string;
  price: string;
  label: string;
  purchaseType: PurchaseType;
  featured?: boolean;
};

const plans: Plan[] = [
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
    buttonHref: "/register",
    features: [
      "500 صفحة معالجة للتجربة المجانية",
      "10 أسئلة بالذكاء الاصطناعي",
      "التجربة المجانية مرة واحدة للحساب",
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
    isPaid: true,
    monthlyPurchaseType: "PRO_MONTHLY",
    yearlyPurchaseType: "PRO_YEARLY",
    features: [
      "مشروعات غير محدودة",
      "5000 صفحة معالجة شهريًا",
      "100 سؤال بالذكاء الاصطناعي شهريًا",
      "إمكانية شراء صفحات إضافية عند الحاجة",
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

const creditPacks: CreditPack[] = [
  {
    credits: "1000 صفحة إضافية",
    price: "$5",
    label: "مناسبة للاحتياجات الإضافية البسيطة",
    purchaseType: "PAGES_1000",
  },
  {
    credits: "3000 صفحة إضافية",
    price: "$12",
    label: "الأفضل للباحثين النشطين",
    purchaseType: "PAGES_3000",
    featured: true,
  },
  {
    credits: "5000 صفحة إضافية",
    price: "$18",
    label: "للمشروعات البحثية الكبيرة",
    purchaseType: "PAGES_5000",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly"
  >("monthly");

  const isYearly = billingCycle === "yearly";

  return (
    <section
      id="pricing"
      dir="rtl"
      className="relative overflow-hidden border-t border-blue-400/10 bg-[#020712] px-4 py-14 text-white sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[7%] top-16 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute bottom-[-100px] right-[8%] h-96 w-96 rounded-full bg-amber-400/[0.055] blur-[135px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={false}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 sm:px-5 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            باقات مرنة للباحثين
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight sm:mt-6 sm:text-4xl md:text-5xl">
            اختر الباقة
            <span className="mr-2 bg-gradient-to-l from-[#ffe5a0] via-[#efb64a] to-[#c97a17] bg-clip-text text-transparent sm:mr-3">
              المناسبة لك
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:mt-5 sm:text-base sm:leading-8 lg:mt-6 lg:text-lg">
            ابدأ مجانًا، ثم انتقل إلى الباقة المناسبة عندما يزيد
            عدد مشروعاتك واحتياجاتك البحثية.
          </p>

          <div className="mt-6 flex justify-center sm:mt-8">
            <div className="relative inline-flex max-w-full items-center rounded-2xl border border-blue-400/20 bg-[#071426]/80 p-1.5 shadow-[0_18px_50px_rgba(15,64,140,.16)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  setBillingCycle("monthly");
                }}
                className={`relative z-10 rounded-xl px-3 py-2.5 text-xs font-black transition sm:px-5 sm:text-sm ${
                  !isYearly
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                شهري
              </button>

              <button
                type="button"
                onClick={() => {
                  setBillingCycle("yearly");
                }}
                className={`relative z-10 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition sm:gap-2 sm:px-5 sm:text-sm ${
                  isYearly
                    ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                سنوي

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black sm:px-2 sm:text-[11px] ${
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

        <div className="mt-10 grid items-stretch gap-4 sm:mt-12 sm:gap-5 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            const price = isYearly
              ? plan.yearlyPrice
              : plan.monthlyPrice;

            const period = isYearly
              ? plan.yearlyPeriod
              : plan.monthlyPeriod;

            const purchaseType = isYearly
              ? plan.yearlyPurchaseType
              : plan.monthlyPurchaseType;

            const buttonClassName = `inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition sm:px-5 sm:py-3.5 sm:text-base ${
              plan.featured
                ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 shadow-[0_12px_30px_rgba(216,165,59,.2)] hover:brightness-110"
                : "border border-blue-400/25 bg-blue-500/[0.07] text-blue-200 hover:border-blue-300/50 hover:bg-blue-500/[0.12]"
            }`;

            return (
              <motion.article
                key={plan.name}
                initial={false}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] border p-5 backdrop-blur-xl transition duration-300 sm:rounded-[26px] sm:p-6 lg:rounded-[28px] lg:p-7 ${
                  plan.featured
                    ? "border-amber-300/55 bg-gradient-to-b from-amber-400/[0.11] via-[#08162a] to-[#061225] shadow-[0_25px_80px_rgba(202,138,4,.15)] lg:-translate-y-3"
                    : "border-blue-400/15 bg-[#061225]/82 hover:-translate-y-2 hover:border-blue-300/40 hover:shadow-[0_22px_60px_rgba(15,64,140,.18)]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-b-2xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-4 py-1.5 text-[11px] font-black text-slate-950 shadow-lg sm:px-5 sm:py-2 sm:text-xs">
                    الأكثر اختيارًا
                  </div>
                )}

                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div
                  className={
                    plan.featured
                      ? "pt-5 sm:pt-6"
                      : ""
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border sm:h-14 sm:w-14 sm:rounded-2xl ${
                        plan.featured
                          ? "border-amber-300/35 bg-amber-400/10 text-amber-300"
                          : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                      }`}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>

                    <span className="text-3xl font-black text-white/[0.04] sm:text-4xl">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black sm:mt-6 sm:text-2xl">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400 lg:min-h-[28px]">
                    {plan.subtitle}
                  </p>

                  <div className="mt-5 flex min-h-[60px] flex-wrap items-end gap-2 sm:mt-7 sm:min-h-[76px]">
                    <motion.span
                      key={`${plan.name}-${billingCycle}`}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                      className={`font-black ${
                        price.length > 7
                          ? "text-2xl sm:text-3xl"
                          : "text-4xl sm:text-5xl md:text-6xl"
                      }`}
                    >
                      {price}
                    </motion.span>

                    {period && (
                      <motion.span
                        key={`${plan.name}-${billingCycle}-period`}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="pb-1 text-xs text-slate-400 sm:pb-2 sm:text-sm"
                      >
                        {period}
                      </motion.span>
                    )}
                  </div>

                  {plan.featured && isYearly && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-300 sm:mt-3 sm:px-3 sm:text-xs"
                    >
                      وفّر 38 دولارًا سنويًا
                    </motion.div>
                  )}

                  <div className="mt-5 h-px bg-white/[0.07] sm:mt-7" />

                  <ul className="mt-5 space-y-3 sm:mt-7 sm:space-y-4">
                    {plan.features.map(
                      (feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm leading-6 text-slate-300 sm:gap-3"
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
                      )
                    )}
                  </ul>
                </div>

                <div className="mt-auto pt-6 sm:pt-8">
                  {plan.isPaid &&
                  purchaseType ? (
                    <PaddleCheckoutButton
                      purchaseType={
                        purchaseType
                      }
                      className={
                        buttonClassName
                      }
                    >
                      {plan.buttonText}
                    </PaddleCheckoutButton>
                  ) : (
                    <Link
                      href={
                        plan.buttonHref ?? "/"
                      }
                      className={
                        buttonClassName
                      }
                    >
                      {plan.buttonText}
                    </Link>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={false}
          className="mt-12 overflow-hidden rounded-[22px] border border-blue-400/15 bg-gradient-to-b from-[#07172b]/95 to-[#04101f]/95 p-5 shadow-[0_25px_80px_rgba(15,64,140,.14)] sm:mt-16 sm:rounded-[26px] sm:p-6 md:p-9 lg:mt-20 lg:rounded-[30px]"
        >
          <div className="flex flex-col items-center justify-between gap-5 text-center sm:gap-6 lg:flex-row lg:text-right">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-400/10 text-amber-300 sm:h-16 sm:w-16 sm:rounded-2xl">
                <FilePlus2 className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <h3 className="text-xl font-black sm:text-2xl md:text-3xl">
                    احتجت صفحات معالجة إضافية؟
                  </h3>

                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black text-blue-300 sm:px-3 sm:text-xs">
                    <Zap className="h-3.5 w-3.5" />
                    بدون تغيير الباقة
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  يمكنك شراء صفحات معالجة إضافية في أي وقت
                  ومواصلة العمل فورًا دون انتظار تجدد
                  اشتراكك الشهري.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:mt-9 md:grid-cols-3">
            {creditPacks.map((pack) => {
              const creditButtonClassName = `mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition sm:mt-5 ${
                pack.featured
                  ? "bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] text-slate-950 hover:brightness-110"
                  : "border border-blue-400/20 bg-blue-500/[0.07] text-blue-200 hover:border-blue-300/45 hover:bg-blue-500/[0.12]"
              }`;

              return (
                <div
                  key={pack.credits}
                  className={`relative rounded-2xl border p-4 transition hover:-translate-y-1 sm:p-5 ${
                    pack.featured
                      ? "border-amber-300/45 bg-amber-400/[0.08]"
                      : "border-blue-400/15 bg-blue-500/[0.045] hover:border-blue-300/35"
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-2.5 py-1 text-[10px] font-black text-slate-950 sm:left-4 sm:top-4 sm:px-3 sm:text-[11px]">
                      الأكثر توفيرًا
                    </span>
                  )}

                  <p className="pr-0 text-xs font-semibold text-slate-400 sm:text-sm">
                    {pack.credits}
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-3xl font-black text-white sm:text-4xl">                      {pack.price}
                    </span>

                    <span className="pb-1 text-xs text-slate-500 sm:text-sm">
                      دفعة واحدة
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {pack.label}
                  </p>

                  <PaddleCheckoutButton
                    purchaseType={
                      pack.purchaseType
                    }
                    className={
                      creditButtonClassName
                    }
                  >
                    شراء الصفحات
                  </PaddleCheckoutButton>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-center text-[11px] leading-6 text-slate-500 sm:mt-6 sm:text-xs">
            الرصيد الإضافي يُضاف إلى صفحات المعالجة المتاحة
            في حسابك، ويتم خصم عدد صفحات المستند الفعلي
            عند بدء المعالجة.
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs leading-6 text-slate-500 sm:mt-8 sm:text-sm sm:leading-7">
          الأسعار الحالية بالدولار الأمريكي، ويتم تنفيذ
          عمليات الدفع من خلال بوابة Paddle الآمنة.
        </p>
      </div>
    </section>
  );
}
