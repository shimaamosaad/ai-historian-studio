import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function SubscriptionStatus() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const userId = (session.user as { id: string }).id;

  if (!userId) {
    return null;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  if (!subscription) {
    return null;
  }

  const remaining = Math.max(
    subscription.monthlyLimit - subscription.usedThisMonth,
    0
  );

  const percent =
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

  const planColor =
    subscription.plan === "FREE"
      ? "bg-slate-700"
      : subscription.plan === "PRO"
      ? "bg-cyan-600"
      : "bg-purple-600";

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${planColor}`}
            >
              {subscription.plan}
            </span>

            <span className="text-sm text-slate-400">
              الخطة الحالية
            </span>
          </div>

          <p className="mt-3 text-sm">
            استخدمت <b>{subscription.usedThisMonth}</b> من{" "}
            <b>{subscription.monthlyLimit}</b> ملف
          </p>

          <p className="mt-1 text-sm text-emerald-400">
            المتبقي: {remaining}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>الاستهلاك</span>
            <span>{percent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{
                width: `${percent}%`,
              }}
            />
          </div>

          <Link
            href="/subscription"
            className="mt-4 block rounded-lg bg-cyan-600 px-4 py-2 text-center text-sm font-semibold transition hover:bg-cyan-500"
          >
            إدارة الاشتراك
          </Link>
        </div>
      </div>
    </div>
  );
}