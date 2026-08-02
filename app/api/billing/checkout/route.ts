import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  purchaseType: z.enum([
    "PRO_MONTHLY",
    "PRO_YEARLY",
    "CREDITS_100",
    "CREDITS_500",
    "CREDITS_1000",
  ]),
});

type PurchaseType = z.infer<
  typeof checkoutSchema
>["purchaseType"];

type CheckoutProduct = {
  priceId: string;
  quantity: number;
  credits: number | null;
  plan: "PRO" | null;
  billingCycle: "MONTHLY" | "YEARLY" | null;
};

function getRequiredEnv(
  name:
    | "PADDLE_PRICE_PRO_MONTHLY"
    | "PADDLE_PRICE_PRO_YEARLY"
    | "PADDLE_PRICE_CREDITS_100"
    | "PADDLE_PRICE_CREDITS_500"
    | "PADDLE_PRICE_CREDITS_1000"
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `متغير البيئة ${name} غير موجود داخل ملف .env`
    );
  }

  return value;
}

function getCheckoutProduct(
  purchaseType: PurchaseType
): CheckoutProduct {
  switch (purchaseType) {
    case "PRO_MONTHLY":
      return {
        priceId: getRequiredEnv(
          "PADDLE_PRICE_PRO_MONTHLY"
        ),
        quantity: 1,
        credits: null,
        plan: "PRO",
        billingCycle: "MONTHLY",
      };

    case "PRO_YEARLY":
      return {
        priceId: getRequiredEnv(
          "PADDLE_PRICE_PRO_YEARLY"
        ),
        quantity: 1,
        credits: null,
        plan: "PRO",
        billingCycle: "YEARLY",
      };

    case "CREDITS_100":
      return {
        priceId: getRequiredEnv(
          "PADDLE_PRICE_CREDITS_100"
        ),
        quantity: 1,
        credits: 100,
        plan: null,
        billingCycle: null,
      };

    case "CREDITS_500":
      return {
        priceId: getRequiredEnv(
          "PADDLE_PRICE_CREDITS_500"
        ),
        quantity: 1,
        credits: 500,
        plan: null,
        billingCycle: null,
      };

    case "CREDITS_1000":
      return {
        priceId: getRequiredEnv(
          "PADDLE_PRICE_CREDITS_1000"
        ),
        quantity: 1,
        credits: 1000,
        plan: null,
        billingCycle: null,
      };
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();

    const userId = (
      session?.user as
        | {
            id?: string;
            email?: string | null;
          }
        | undefined
    )?.id;

    const userEmail = session?.user?.email;

    if (!userId || !userEmail) {
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

    const body = await request.json();

    const validationResult =
      checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            "نوع الاشتراك أو الرصيد المطلوب غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const { purchaseType } =
      validationResult.data;

    const product =
      getCheckoutProduct(purchaseType);

    if (!product.priceId.startsWith("pri_")) {
      throw new Error(
        `Price ID غير صحيح للعنصر ${purchaseType}`
      );
    }

    return NextResponse.json({
      checkout: {
        items: [
          {
            priceId: product.priceId,
            quantity: product.quantity,
          },
        ],

        customer: {
          email: userEmail,
        },

        customData: {
          userId,
          purchaseType,
          plan: product.plan,
          billingCycle:
            product.billingCycle,
          credits: product.credits,
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