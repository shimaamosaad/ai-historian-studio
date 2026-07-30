import { prisma } from "@/lib/prisma";

type SubscriptionData = {
  id: number;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  monthlyLimit: number;
  usedThisMonth: number;
  extraCredits: number;
  remainingFiles: number;
  totalRemainingFiles: number;
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
        | "MONTHLY_LIMIT_REACHED";
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
        monthlyLimit: true,
        usedThisMonth: true,
        extraCredits: true,
        startsAt: true,
        expiresAt: true,
      },
    });

  if (!subscription) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_NOT_FOUND",
      message: "لا يوجد اشتراك مرتبط بهذا الحساب.",
    };
  }

  const remainingFiles = Math.max(
    subscription.monthlyLimit -
      subscription.usedThisMonth,
    0
  );

  const totalRemainingFiles =
    remainingFiles + subscription.extraCredits;

  const subscriptionData: SubscriptionData = {
    ...subscription,
    remainingFiles,
    totalRemainingFiles,
  };

  const now = new Date();

  if (
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
        remainingFiles: 0,
        totalRemainingFiles: 0,
      },
    };
  }

  const monthlyLimitReached =
    subscription.usedThisMonth >=
    subscription.monthlyLimit;

  const hasExtraCredits =
    subscription.extraCredits > 0;

  if (monthlyLimitReached && !hasExtraCredits) {
    return {
      allowed: false,
      reason: "MONTHLY_LIMIT_REACHED",
      message:
        "لقد استهلكت الحد الشهري والأرصدة الإضافية. يرجى شراء رصيد إضافي أو الانتظار حتى تجديد الحد الشهري.",
      subscription: subscriptionData,
    };
  }

  return {
    allowed: true,
    subscription: subscriptionData,
  };
}