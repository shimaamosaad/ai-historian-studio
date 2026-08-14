"use client";

import { useState } from "react";

import { getPaddle } from "@/lib/paddle/client";

export type PurchaseType =
  | "PRO_MONTHLY"
  | "PRO_YEARLY"
  | "PAGES_1000"
  | "PAGES_3000"
  | "PAGES_5000"
  | "QUESTIONS_100";

type CheckoutResponse = {
  checkout?: {
    items: Array<{
      priceId: string;
      quantity: number;
    }>;

    customer: {
      email: string;
    };

    customData: {
      userId: string;
      purchaseType: PurchaseType;
      plan: "PRO" | null;
      billingCycle:
        | "MONTHLY"
        | "YEARLY"
        | null;
      extraPages: number | null;
      extraQuestions: number | null;
    };
  };

  error?: string;
};

type Props = {
  purchaseType: PurchaseType;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export default function PaddleCheckoutButton({
  purchaseType,
  children,
  className = "",
  disabled = false,
}: Props) {
  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function openCheckout() {
    if (isLoading || disabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/billing/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            purchaseType,
          }),
        }
      );

      const result =
        (await response.json()) as CheckoutResponse;

      if (
        !response.ok ||
        !result.checkout
      ) {
        throw new Error(
          result.error ||
            "تعذر تجهيز عملية الدفع."
        );
      }

      const paddle =
        await getPaddle();

      if (!paddle) {
        throw new Error(
          "تعذر تشغيل بوابة الدفع. تأكدي من إعداد Client-side Token."
        );
      }

      paddle.Checkout.open({
        items:
          result.checkout.items,

        customer: {
          email:
            result.checkout
              .customer.email,
        },

        customData:
          result.checkout
            .customData,

        settings: {
          displayMode:
            "overlay",

          variant:
            "one-page",

          theme:
            "dark",

          locale:
            "en",

          allowLogout:
            false,
        },
      });
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "حدث خطأ أثناء فتح صفحة الدفع.";

      console.error(
        "PADDLE_CHECKOUT_ERROR:",
        checkoutError
      );

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openCheckout}
        disabled={
          disabled ||
          isLoading
        }
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isLoading
          ? "جاري فتح الدفع..."
          : children}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-center text-sm font-semibold text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}