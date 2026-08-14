import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SubscriptionActions from "@/components/subscription/SubscriptionActions";

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
      return "مناسبة للباحثين الذين يحتاجون إلى معالجة عدد أكبر من الصفحات واستخدام موسع لأدوات الذكاء الاصطناعي.";

    case "ENTERPRISE":
      return "مناسبة للمؤسسات والمراكز البحثية وفرق العمل ذات الاستخدام الكبير.";

    default:
      return "تجربة مجانية لبدء استخدام أثر ومعالجة المستندات وطرح الأسئلة البحثية.";
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

  if (!session?.user?.id) {
    redirect("/login");
  }

  const subscription =
    await prisma.subscription.findUnique({
      where: {
        userId: session.user.id,
      },
    });

  if (!subscription) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-6 py-12 text-white"
      >
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-2xl font-bold text-red-300">
            لم يتم العثور على الاشتراك
          </h1>

          <p className="mt-3 text-sm leading-7 text-red-100">
            لا يوجد اشتراك مرتبط بهذا الحساب. حاولي تسجيل
            الخروج ثم تسجيل الدخول مرة أخرى.
          </p>
        </div>
      </main>
    );
  }

  const remainingPages = Math.max(
    subscription.pageLimit -
      subscription.usedPages,
    0
  );

  const totalRemainingPages =
    remainingPages +
    subscription.extraPages;

  const pageUsagePercentage =
    subscription.pageLimit > 0
      ? Math.min(
          Math.round(
            (subscription.usedPages /
              subscription.pageLimit) *
              100
          ),
          100
        )
      : 0;

  const remainingQuestions = Math.max(
    subscription.questionLimit -
      subscription.usedQuestions,
    0
  );

  const totalRemainingQuestions =
    remainingQuestions +
    subscription.extraQuestions;

  const questionUsagePercentage =
    subscription.questionLimit > 0
      ? Math.min(
          Math.round(
            (subscription.usedQuestions /
              subscription.questionLimit) *
              100
          ),
          100
        )
      : 0;

  const isPageLimitReached =
    totalRemainingPages <= 0;

  const isQuestionLimitReached =
    totalRemainingQuestions <= 0;

  const isFree =
    subscription.plan === "FREE";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white"
    >
      <div className="mx-auto max-w-6xl">

  {/* زر الرجوع للصفحة الرئيسية */}
  <div className="mb-6 flex items-center justify-start">
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20 hover:text-cyan-200"
    >
      <span>←</span>
      <span>الصفحة الرئيسية</span>
    </Link>
  </div>

  <div className="mb-8">
    <p className="text-sm font-bold text-cyan-400">
      حسابك في أثر
    </p>

    <h1 className="mt-2 text-3xl font-black">
      الاشتراك والاستخدام
    </h1>

    <p className="mt-3 max-w-3xl leading-7 text-slate-400">
      تابعي رصيد معالجة الصفحات وأسئلة الذكاء
      الاصطناعي المتاحة في خطتك.
    </p>
  </div>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              الخطة الحالية
            </p>

            <h2 className="mt-3 text-2xl font-black text-cyan-400">
              {getPlanName(subscription.plan)}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              {getPlanDescription(
                subscription.plan
              )}
            </p>

            {isFree && (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-200">
                الرصيد المجاني تجربة واحدة للحساب
                ولا يتجدد شهريًا.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              صفحات المعالجة المتبقية
            </p>

            <p
              className={`mt-3 text-3xl font-black ${
                isPageLimitReached
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {totalRemainingPages}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              من أصل {subscription.pageLimit} صفحة
            </p>

            {subscription.extraPages > 0 && (
              <p className="mt-2 text-xs text-amber-300">
                يشمل{" "}
                {subscription.extraPages} صفحة
                إضافية
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              أسئلة الذكاء الاصطناعي المتبقية
            </p>

            <p
              className={`mt-3 text-3xl font-black ${
                isQuestionLimitReached
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {totalRemainingQuestions}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              من أصل{" "}
              {subscription.questionLimit} سؤال
            </p>

            {subscription.extraQuestions >
              0 && (
              <p className="mt-2 text-xs text-amber-300">
                يشمل{" "}
                {subscription.extraQuestions} سؤال
                إضافي
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  استهلاك الصفحات
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  تمت معالجة{" "}
                  {subscription.usedPages} صفحة من
                  رصيد الخطة.
                </p>
              </div>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold">
                {subscription.usedPages} /{" "}
                {subscription.pageLimit}
              </span>
            </div>

            <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  isPageLimitReached
                    ? "bg-red-500"
                    : "bg-cyan-500"
                }`}
                style={{
                  width: `${pageUsagePercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              تم استخدام {pageUsagePercentage}% من
              رصيد الصفحات الأساسي.
            </p>

            {isPageLimitReached && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-7 text-red-200">
                {isFree
                  ? "تم استهلاك رصيد صفحات المعالجة المجاني. يمكنك الترقية إلى PRO للمتابعة."
                  : "تم استهلاك رصيد صفحات المعالجة. يمكنك شراء صفحات إضافية للمتابعة."}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  استهلاك الأسئلة
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  تم استخدام{" "}
                  {subscription.usedQuestions} سؤال
                  بالذكاء الاصطناعي.
                </p>
              </div>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold">
                {subscription.usedQuestions} /{" "}
                {subscription.questionLimit}
              </span>
            </div>

            <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  isQuestionLimitReached
                    ? "bg-red-500"
                    : "bg-amber-400"
                }`}
                style={{
                  width: `${questionUsagePercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-400">
              تم استخدام{" "}
              {questionUsagePercentage}% من رصيد
              الأسئلة الأساسي.
            </p>

            {isQuestionLimitReached && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-7 text-red-200">
                {isFree
                  ? "تم استهلاك رصيد أسئلة الذكاء الاصطناعي المجاني. يمكنك الترقية إلى PRO للمتابعة."
                  : "تم استهلاك رصيد أسئلة الذكاء الاصطناعي المتاح في خطتك."}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold">
              تفاصيل الاشتراك
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  بداية الاشتراك
                </span>

                <span>
                  {formatDate(
                    subscription.startsAt
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  انتهاء الاشتراك
                </span>

                <span>
                  {isFree
                    ? "لا ينطبق على التجربة المجانية"
                    : formatDate(
                        subscription.expiresAt
                      )}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  الصفحات الإضافية
                </span>

                <span>
                  {subscription.extraPages}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">
                  الأسئلة الإضافية
                </span>

                <span>
                  {subscription.extraQuestions}
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

          <SubscriptionActions
            plan={subscription.plan}
          />
        </section>
      </div>
    </main>
  );
}