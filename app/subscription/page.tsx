import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getPlanName(plan: string) {
  switch (plan) {
    case "PRO":
      return "الخطة الاحترافية";
    case "ENTERPRISE":
      return "خطة المؤسسات";
    default:
      return "الخطة المجانية";
  }
}

function getPlanDescription(plan: string) {
  switch (plan) {
    case "PRO":
      return "مناسبة للباحثين الذين يحتاجون إلى تحليل عدد أكبر من المستندات.";
    case "ENTERPRISE":
      return "مناسبة للمؤسسات والمراكز البحثية وفرق العمل.";
    default:
      return "مناسبة لتجربة منصة أثر والبدء في تحليل المستندات التاريخية.";
  }
}

function formatDate(date: Date | null) {
  if (!date) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id: string }).id;

  if (!userId) {
    redirect("/login");
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  if (!subscription) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-12 text-white"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-2xl font-bold">
            لم يتم العثور على الاشتراك
          </h1>

          <p className="mt-3 text-sm text-red-100">
            لا يوجد اشتراك مرتبط بهذا الحساب. حاولي تسجيل الخروج ثم
            إنشاء حساب جديد.
          </p>
        </div>
      </main>
    );
  }

  const remainingFiles = Math.max(
    subscription.monthlyLimit - subscription.usedThisMonth,
    0
  );

  const usagePercentage =
    subscription.monthlyLimit > 0
      ? Math.min(
          Math.round(
            (subscription.usedThisMonth /
              subscription.monthlyLimit) *
              100
          ),
          100
        )
      : 0;

  const isLimitReached = remainingFiles === 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-cyan-400">
            حسابك في أثر
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            الاشتراك والاستخدام
          </h1>

          <p className="mt-3 text-slate-400">
            تابعي خطتك الحالية وعدد المستندات المستخدمة والمتبقية.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              الخطة الحالية
            </p>

            <h2 className="mt-3 text-2xl font-bold text-cyan-400">
              {getPlanName(subscription.plan)}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {getPlanDescription(subscription.plan)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              المستخدم هذا الشهر
            </p>

            <p className="mt-3 text-3xl font-bold">
              {subscription.usedThisMonth}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              من أصل {subscription.monthlyLimit} مستند
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              المستندات المتبقية
            </p>

            <p
              className={`mt-3 text-3xl font-bold ${
                isLimitReached
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {remainingFiles}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              مستند متاح للرفع
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                استهلاك الباقة
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                تم استخدام {usagePercentage}% من الحد الشهري.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
              {subscription.usedThisMonth} /{" "}
              {subscription.monthlyLimit}
            </span>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                isLimitReached
                  ? "bg-red-500"
                  : "bg-cyan-500"
              }`}
              style={{
                width: `${usagePercentage}%`,
              }}
            />
          </div>

          {isLimitReached && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              لقد استهلكتِ الحد الشهري بالكامل، ولن يمكن رفع مستندات
              جديدة حتى تجديد الباقة أو الترقية إلى خطة أعلى.
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">
              تفاصيل الاشتراك
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  بداية الاشتراك
                </span>

                <span>
                  {formatDate(subscription.startsAt)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  انتهاء الاشتراك
                </span>

                <span>
                  {formatDate(subscription.expiresAt)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">
                  البريد الإلكتروني
                </span>

                <span className="break-all text-left">
                  {session.user.email}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
            <h2 className="text-xl font-semibold">
              تحتاجين إلى ملفات أكثر؟
            </h2>

            <p className="mt-3 text-sm leading-6 text-cyan-100">
              الخطة الاحترافية ستسمح بعدد أكبر من المستندات التاريخية
              ومزايا إضافية للباحثين.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 opacity-60"
            >
              الترقية إلى PRO قريبًا
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}