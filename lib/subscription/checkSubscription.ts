import { prisma } from "@/lib/prisma";

type SubscriptionData = {
  id: number;
  plan: "FREE" | "PRO" | "ENTERPRISE";

  // النظام القديم - مؤقتًا
  monthlyLimit: number;
  usedThisMonth: number;
  extraCredits: number;
  remainingFiles: number;
  totalRemainingFiles: number;

  // نظام الصفحات
  pageLimit: number;
  usedPages: number;
  extraPages: number;
  remainingPages: number;
  totalRemainingPages: number;

  // نظام الأسئلة
  questionLimit: number;
  usedQuestions: number;
  extraQuestions: number;
  remainingQuestions: number;
  totalRemainingQuestions: number;

  freeTrialUsed: boolean;

  startsAt: Date;
  expiresAt: Date | null;
};

export type SubscriptionCheckResult =
  | {
      allowed: true;
      subscription: SubscriptionData;
    }
  | {
      allowed: false;
      reason:
        | "SUBSCRIPTION_NOT_FOUND"
        | "SUBSCRIPTION_EXPIRED"
        | "PAGE_LIMIT_REACHED"
        | "QUESTION_LIMIT_REACHED";
      message: string;
      subscription?: SubscriptionData;
    };

export async function checkSubscription(
  userId: string
): Promise<SubscriptionCheckResult> {
  const subscription =
    await prisma.subscription.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
        plan: true,

        // النظام القديم
        monthlyLimit: true,
        usedThisMonth: true,
        extraCredits: true,

        // الصفحات
        pageLimit: true,
        usedPages: true,
        extraPages: true,

        // الأسئلة
        questionLimit: true,
        usedQuestions: true,
        extraQuestions: true,

        freeTrialUsed: true,

        startsAt: true,
        expiresAt: true,
      },
    });

  if (!subscription) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_NOT_FOUND",
      message:
        "لا يوجد اشتراك مرتبط بهذا الحساب.",
    };
  }

  /*
   * ==============================
   * النظام القديم - مؤقتًا
   * ==============================
   */

  const remainingFiles = Math.max(
    subscription.monthlyLimit -
      subscription.usedThisMonth,
    0
  );

  const totalRemainingFiles =
    remainingFiles +
    subscription.extraCredits;

  /*
   * ==============================
   * رصيد الصفحات
   * ==============================
   */

  const remainingPages = Math.max(
    subscription.pageLimit -
      subscription.usedPages,
    0
  );

  const totalRemainingPages =
    remainingPages +
    subscription.extraPages;

  /*
   * ==============================
   * رصيد أسئلة AI
   * ==============================
   */

  const remainingQuestions = Math.max(
    subscription.questionLimit -
      subscription.usedQuestions,
    0
  );

  const totalRemainingQuestions =
    remainingQuestions +
    subscription.extraQuestions;

  const subscriptionData: SubscriptionData = {
    ...subscription,

    remainingFiles,
    totalRemainingFiles,

    remainingPages,
    totalRemainingPages,

    remainingQuestions,
    totalRemainingQuestions,
  };

  const now = new Date();

  /*
   * الاشتراكات المدفوعة ذات تاريخ انتهاء.
   *
   * FREE لا نعتمد على expiresAt وحده
   * لأن التجربة المجانية مبنية على رصيد ثابت
   * لا يتجدد شهريًا.
   */
  if (
    subscription.plan !== "FREE" &&
    subscription.expiresAt &&
    subscription.expiresAt <= now
  ) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_EXPIRED",
      message:
        "انتهت صلاحية الاشتراك. يرجى تجديد الاشتراك للمتابعة.",

      subscription: {
        ...subscriptionData,

        remainingPages: 0,
        totalRemainingPages: 0,

        remainingQuestions: 0,
        totalRemainingQuestions: 0,
      },
    };
  }

  /*
   * لا نرفض المستخدم هنا بسبب انتهاء رصيد الصفحات
   * أو الأسئلة بشكل عام؛ لأن كل عملية ستتحقق
   * من نوع الرصيد الذي تحتاجه.
   *
   * checkSubscription هنا يتأكد فقط أن
   * الاشتراك موجود وصالح.
   */

  return {
    allowed: true,
    subscription: subscriptionData,
  };
}