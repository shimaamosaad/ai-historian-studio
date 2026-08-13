"use client";

import PaddleCheckoutButton from "@/components/payments/PaddleCheckoutButton";

type Props = {
  plan: "FREE" | "PRO" | "ENTERPRISE";
};

export default function SubscriptionActions({
  plan,
}: Props) {
  if (plan === "FREE") {
    return (
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
        <h2 className="text-xl font-bold">
          جاهزة للانتقال إلى PRO؟
        </h2>

        <p className="mt-3 text-sm leading-7 text-cyan-100">
          الخطة الاحترافية تمنحك 5000 صفحة معالجة و100 سؤال
          بالذكاء الاصطناعي شهريًا، بالإضافة إلى إمكانية شراء
          صفحات إضافية عند الحاجة.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PaddleCheckoutButton
            purchaseType="PRO_MONTHLY"
            className="w-full rounded-xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-5 py-3 font-bold text-slate-950 transition hover:brightness-110"
          >
            PRO شهريًا — $19
          </PaddleCheckoutButton>

          <PaddleCheckoutButton
            purchaseType="PRO_YEARLY"
            className="w-full rounded-xl border border-amber-300/40 bg-amber-400/10 px-5 py-3 font-bold text-amber-200 transition hover:bg-amber-400/15"
          >
            PRO سنويًا — $190
          </PaddleCheckoutButton>
        </div>

        <p className="mt-4 text-xs leading-6 text-cyan-200/70">
          شراء الصفحات الإضافية متاح بعد الترقية إلى PRO.
        </p>
      </div>
    );
  }

  if (plan === "PRO") {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-6">
        <h2 className="text-xl font-bold text-amber-200">
          احتجت صفحات إضافية؟
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-300">
          يمكنك إضافة صفحات إلى رصيدك الحالي دون تغيير اشتراك
          PRO.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold">
                  1000 صفحة إضافية
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  دفعة واحدة
                </p>
              </div>

              <span className="text-2xl font-black text-white">
                $5
              </span>
            </div>

            <PaddleCheckoutButton
              purchaseType="PAGES_1000"
              className="mt-4 w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 font-bold text-blue-200 transition hover:bg-blue-500/15"
            >
              شراء 1000 صفحة
            </PaddleCheckoutButton>
          </div>

          <div className="rounded-xl border border-amber-300/30 bg-amber-400/[0.07] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-amber-100">
                  3000 صفحة إضافية
                </p>
                <p className="mt-1 text-xs text-amber-200/70">
                  الأكثر توفيرًا
                </p>
              </div>

              <span className="text-2xl font-black text-white">
                $12
              </span>
            </div>

            <PaddleCheckoutButton
              purchaseType="PAGES_3000"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d8a53b] to-[#f5d27a] px-5 py-3 font-bold text-slate-950 transition hover:brightness-110"
            >
              شراء 3000 صفحة
            </PaddleCheckoutButton>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold">
                  5000 صفحة إضافية
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  للمشروعات البحثية الكبيرة
                </p>
              </div>

              <span className="text-2xl font-black text-white">
                $18
              </span>
            </div>

            <PaddleCheckoutButton
              purchaseType="PAGES_5000"
              className="mt-4 w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 font-bold text-blue-200 transition hover:bg-blue-500/15"
            >
              شراء 5000 صفحة
            </PaddleCheckoutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-6">
      <h2 className="text-xl font-bold text-violet-200">
        حساب مؤسسة
      </h2>

      <p className="mt-3 text-sm leading-7 text-violet-100">
        إدارة الأرصدة والإضافات لحسابات المؤسسات تتم وفق الخطة
        المتفق عليها.
      </p>
    </div>
  );
}