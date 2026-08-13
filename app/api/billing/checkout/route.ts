import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  purchaseType: z.enum([
    "PRO_MONTHLY",
    "PRO_YEARLY",
    "PAGES_1000",
    "PAGES_3000",
    "PAGES_5000",
  ]),
});

type PurchaseType =
  z.infer<
    typeof checkoutSchema
  >["purchaseType"];

type CheckoutProduct = {
  priceId: string;
  quantity: number;

  plan:
    | "PRO"
    | null;

  billingCycle:
    | "MONTHLY"
    | "YEARLY"
    | null;

  extraPages:
    | number
    | null;
};

function getRequiredEnv(
  name:
    | "PADDLE_PRICE_PRO_MONTHLY"
    | "PADDLE_PRICE_PRO_YEARLY"
    | "PADDLE_PRICE_PAGES_1000"
    | "PADDLE_PRICE_PAGES_3000"
    | "PADDLE_PRICE_PAGES_5000"
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `متغير البيئة ${name} غير موجود داخل ملف .env`
    );
  }

  return value;
}

function getCheckoutProduct(
  purchaseType:
    PurchaseType
): CheckoutProduct {
  switch (purchaseType) {
    case "PRO_MONTHLY":
      return {
        priceId:
          getRequiredEnv(
            "PADDLE_PRICE_PRO_MONTHLY"
          ),

        quantity: 1,

        plan: "PRO",

        billingCycle:
          "MONTHLY",

        extraPages:
          null,
      };

    case "PRO_YEARLY":
      return {
        priceId:
          getRequiredEnv(
            "PADDLE_PRICE_PRO_YEARLY"
          ),

        quantity: 1,

        plan: "PRO",

        billingCycle:
          "YEARLY",

        extraPages:
          null,
      };

    case "PAGES_1000":
      return {
        priceId:
          getRequiredEnv(
            "PADDLE_PRICE_PAGES_1000"
          ),

        quantity: 1,

        plan: null,

        billingCycle:
          null,

        extraPages:
          1000,
      };

    case "PAGES_3000":
      return {
        priceId:
          getRequiredEnv(
            "PADDLE_PRICE_PAGES_3000"
          ),

        quantity: 1,

        plan: null,

        billingCycle:
          null,

        extraPages:
          3000,
      };

    case "PAGES_5000":
      return {
        priceId:
          getRequiredEnv(
            "PADDLE_PRICE_PAGES_5000"
          ),

        quantity: 1,

        plan: null,

        billingCycle:
          null,

        extraPages:
          5000,
      };
  }
}

function isExtraPagesPurchase(
  purchaseType:
    PurchaseType
) {
  return (
    purchaseType ===
      "PAGES_1000" ||
    purchaseType ===
      "PAGES_3000" ||
    purchaseType ===
      "PAGES_5000"
  );
}

export async function POST(
  request:
    NextRequest
) {
  try {
    const session =
      await auth();

    if (
      !session?.user?.id ||
      !session.user.email
    ) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا لإتمام عملية الشراء.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      session.user.id;

    const userEmail =
      session.user.email;

    const body =
      await request.json();

    const validationResult =
      checkoutSchema.safeParse(
        body
      );

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "نوع الاشتراك أو حزمة الصفحات المطلوبة غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      purchaseType,
    } =
      validationResult.data;

    // ==============================
    // التحقق من الخطة الحالية
    // ==============================

    const subscription =
      await prisma.subscription.findUnique({
        where: {
          userId,
        },

        select: {
          plan: true,
          expiresAt: true,
          paddleStatus: true,
        },
      });

    if (!subscription) {
      return NextResponse.json(
        {
          error:
            "لا يوجد اشتراك مرتبط بهذا الحساب.",
        },
        {
          status: 404,
        }
      );
    }

    // ==============================
    // الصفحات الإضافية متاحة لـ PRO فقط
    // ==============================

    if (
      isExtraPagesPurchase(
        purchaseType
      )
    ) {
      if (
        subscription.plan !==
        "PRO"
      ) {
        return NextResponse.json(
          {
            error:
              "شراء الصفحات الإضافية متاح لمشتركي PRO فقط. يرجى الترقية إلى الخطة الاحترافية أولًا.",
            reason:
              "PRO_REQUIRED",
          },
          {
            status: 403,
          }
        );
      }

      const now =
        new Date();

      if (
        subscription.expiresAt &&
        subscription.expiresAt <=
          now
      ) {
        return NextResponse.json(
          {
            error:
              "انتهت صلاحية اشتراك PRO. يرجى تجديد الاشتراك قبل شراء صفحات إضافية.",
            reason:
              "SUBSCRIPTION_EXPIRED",
          },
          {
            status: 403,
          }
        );
      }

      if (
        subscription.paddleStatus &&
        ![
          "active",
          "trialing",
        ].includes(
          subscription.paddleStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              "اشتراك PRO غير نشط حاليًا. يرجى تجديد أو تفعيل الاشتراك أولًا.",
            reason:
              "SUBSCRIPTION_INACTIVE",
          },
          {
            status: 403,
          }
        );
      }
    }

    const product =
      getCheckoutProduct(
        purchaseType
      );

    if (
      !product.priceId.startsWith(
        "pri_"
      )
    ) {
      throw new Error(
        `Price ID غير صحيح للعنصر ${purchaseType}`
      );
    }

    return NextResponse.json({
      checkout: {
        items: [
          {
            priceId:
              product.priceId,

            quantity:
              product.quantity,
          },
        ],

        customer: {
          email:
            userEmail,
        },

        customData: {
          userId,

          purchaseType,

          plan:
            product.plan,

          billingCycle:
            product.billingCycle,

          extraPages:
            product.extraPages,
        },
      },
    });
  } catch (error) {
    console.error(
      "PADDLE_CHECKOUT_API_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تجهيز عملية الدفع.",
      },
      {
        status: 500,
      }
    );
  }
}